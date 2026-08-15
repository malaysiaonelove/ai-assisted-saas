import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * The org's current subscription (latest ACTIVE one, falling back to the
   * most recent subscription, then the Free plan if none exists yet).
   */
  async getCurrent(organizationId: string) {
    const active = await this.prisma.subscription.findFirst({
      where: { organizationId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (active) {
      return active;
    }
    const latest = await this.prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (latest) {
      return latest;
    }
    const freePlan = await this.prisma.plan.findUnique({
      where: { slug: 'free' },
    });
    return { id: null, status: 'ACTIVE', plan: freePlan };
  }

  /**
   * Starts a subscription change. Paid plans go through Paystack checkout;
   * free plans activate immediately (no payment required).
   */
  async checkout(
    organizationId: string,
    userEmail: string,
    planId: string,
  ) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found');
    }

    const current = await this.prisma.subscription.findFirst({
      where: { organizationId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (current?.planId === planId) {
      throw new BadRequestException(`You are already on the ${plan.name} plan`);
    }

    const now = new Date();
    const periodEnd = addMonths(now, 1);

    // Only one pending invoice at a time.
    await this.prisma.invoice.updateMany({
      where: { organizationId, status: 'PENDING' },
      data: { status: 'CANCELED' },
    });

    const subscription = await this.prisma.subscription.create({
      data: {
        organizationId,
        planId,
        status: 'PENDING',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: await this.nextInvoiceNumber(organizationId),
        organizationId,
        subscriptionId: subscription.id,
        planId,
        amount: plan.price,
        provider: 'PAYSTACK',
        periodStart: now,
        periodEnd,
      },
    });

    // Free plan: activate immediately, no gateway involved.
    if (plan.price === 0) {
      await this.paymentsService.markInvoicePaid(invoice.id);
      return {
        activated: true,
        plan: { id: plan.id, name: plan.name, slug: plan.slug },
      };
    }

    const reference = `SB-${organizationId.slice(0, 8)}-${Date.now()}`;
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { providerReference: reference },
    });

    const checkout = await this.paymentsService.initializeCheckout({
      email: userEmail,
      amount: plan.price,
      reference,
      metadata: {
        organizationId,
        planId: plan.id,
        planName: plan.name,
      },
    });

    return {
      activated: false,
      authorizationUrl: checkout.authorization_url,
      reference,
      invoiceId: invoice.id,
    };
  }

  /**
   * Stops auto-renewal at the end of the current billing period.
   */
  async cancel(organizationId: string) {
    const active = await this.prisma.subscription.findFirst({
      where: { organizationId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!active) {
      throw new BadRequestException('No active subscription to cancel');
    }
    return this.prisma.subscription.update({
      where: { id: active.id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  private async nextInvoiceNumber(organizationId: string) {
    const count = await this.prisma.invoice.count({
      where: { organizationId },
    });
    return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
}
