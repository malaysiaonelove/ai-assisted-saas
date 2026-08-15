import {
  Controller,
  Headers,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Paystack posts events here. The raw body is required to verify the
   * HMAC-SHA512 signature, so this route is intentionally public.
   */
  @Post('webhook')
  async webhook(
    @Req() req: Request,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody?.toString() ?? '';
    this.paymentsService.assertWebhookSignature(rawBody, signature);
    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: { reference?: string; receipt?: { url?: string } };
    };
    await this.paymentsService.handleWebhookEvent(event);
    return { received: true };
  }

  @Post(':invoiceId/verify')
  @UseGuards(JwtAuthGuard)
  verifyInvoice(
    @CurrentUser() user: AuthUser,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.paymentsService.verifyInvoice(user.organizationId, invoiceId);
  }

  @Post('verify/reference/:reference')
  @UseGuards(JwtAuthGuard)
  async verifyByReference(
    @CurrentUser() user: AuthUser,
    @Param('reference') reference: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { providerReference: reference, organizationId: user.organizationId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return this.paymentsService.verifyInvoice(user.organizationId, invoice.id);
  }
}
