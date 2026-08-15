import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string, reference?: string) {
    return this.prisma.invoice.findMany({
      where: {
        organizationId,
        ...(reference ? { providerReference: reference } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { id: true, name: true, slug: true, price: true } },
        subscription: { select: { id: true, status: true } },
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        plan: true,
        organization: true,
        subscription: { include: { plan: true } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }
}
