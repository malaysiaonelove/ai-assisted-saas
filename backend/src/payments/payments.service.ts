import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get headers() {
    return {
      Authorization: `Bearer ${this.config.get<string>('PAYSTACK_SECRET_KEY')}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Starts a Paystack hosted checkout for a one-off charge.
   * Amount is in NGN; Paystack expects kobo (amount * 100).
   */
  async initializeCheckout(params: {
    email: string;
    amount: number;
    reference: string;
    metadata: Record<string, unknown>;
  }) {
    const res = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        email: params.email,
        amount: Math.round(params.amount * 100),
        reference: params.reference,
        callback_url: this.config.get<string>('PAYSTACK_CALLBACK_URL'),
        metadata: params.metadata,
      }),
    });
    const json = (await res.json()) as {
      status: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!res.ok || !json.status || !json.data) {
      throw new BadGatewayException(
        `Paystack initialize failed: ${json.message ?? res.statusText}`,
      );
    }
    return json.data;
  }

  async verifyTransaction(reference: string) {
    const res = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: this.headers },
    );
    const json = (await res.json()) as {
      status: boolean;
      message?: string;
      data?: { status: string; reference: string; receipt?: { url?: string } };
    };
    if (!res.ok || !json.status || !json.data) {
      throw new BadGatewayException(
        `Paystack verify failed: ${json.message ?? res.statusText}`,
      );
    }
    return json.data;
  }

  /**
   * Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const hash = createHmac(
      'sha512',
      this.config.get<string>('PAYSTACK_SECRET_KEY') ?? '',
    )
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }

  /**
   * Handles a verified Paystack webhook event.
   */
  async handleWebhookEvent(event: { event?: string; data?: { reference?: string; receipt?: { url?: string } } }) {
    if (event.event !== 'charge.success' || !event.data?.reference) {
      return;
    }
    const invoice = await this.prisma.invoice.findUnique({
      where: { providerReference: event.data.reference },
    });
    if (!invoice || invoice.status === 'PAID') {
      return;
    }
    await this.markInvoicePaid(invoice.id, event.data.receipt?.url);
  }

  /**
   * Re-verifies an invoice's payment status against Paystack.
   * Useful when webhooks aren't configured yet (e.g. local dev).
   */
  async verifyInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === 'PAID') {
      return this.markInvoicePaid(invoice.id);
    }
    if (!invoice.providerReference) {
      throw new BadRequestException('Invoice has no payment reference');
    }
    const data = await this.verifyTransaction(invoice.providerReference);
    if (data.status !== 'success') {
      throw new BadRequestException('Payment has not been completed yet');
    }
    return this.markInvoicePaid(invoice.id, data.receipt?.url);
  }

  /**
   * Marks an invoice as paid and activates its subscription, canceling any
   * other active subscriptions for the same organization.
   */
  async markInvoicePaid(invoiceId: string, receiptUrl?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === 'PAID') {
      return this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { plan: true },
      });
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: now, receiptUrl: receiptUrl ?? null },
      }),
      this.prisma.subscription.update({
        where: { id: invoice.subscriptionId },
        data: {
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
          currentPeriodStart: invoice.periodStart,
          currentPeriodEnd: invoice.periodEnd,
        },
      }),
      this.prisma.subscription.updateMany({
        where: {
          organizationId: invoice.organizationId,
          status: 'ACTIVE',
          id: { not: invoice.subscriptionId },
        },
        data: { status: 'CANCELED' },
      }),
    ]);

    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { plan: true },
    });
  }

  /**
   * Rejects requests that don't carry a valid Paystack webhook signature.
   */
  assertWebhookSignature(rawBody: string, signature: string | undefined) {
    if (!signature || !this.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
