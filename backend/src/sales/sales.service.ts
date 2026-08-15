import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

const saleInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      unitPrice: true,
      quantity: true,
      total: true,
    },
  },
  createdBy: { select: { id: true, username: true } },
} as const;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, userId: string, dto: CreateSaleDto) {
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, orgId: organizationId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    const items = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.prisma.product.findFirst({
          where: { id: item.productId, orgId: organizationId },
        });
        if (!product) {
          throw new NotFoundException(`Product "${item.productId}" not found`);
        }
        const unitPrice = item.unitPrice ?? product.price;
        const total = unitPrice * item.quantity;
        return {
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          total,
        };
      }),
    );

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = dto.discount ?? 0;
    const tax = dto.tax ?? 0;
    const total = Math.max(0, subtotal - discount + tax);
    const status = dto.status ?? 'PAID';

    return this.prisma.sale.create({
      data: {
        orgId: organizationId,
        createdById: userId,
        customerId: dto.customerId ?? null,
        invoiceNumber: await this.nextInvoiceNumber(organizationId),
        subtotal,
        discount,
        tax,
        total,
        status,
        paidAt: status === 'PAID' ? new Date() : null,
        notes: dto.notes,
        items: { create: items },
      },
      include: saleInclude,
    });
  }

  findAll(organizationId: string, search?: string, limit?: number) {
    return this.prisma.sale.findMany({
      where: {
        orgId: organizationId,
        ...(search
          ? {
              OR: [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { items: { some: { productName: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : undefined,
      include: saleInclude,
    });
  }

  async findOne(organizationId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, orgId: organizationId },
      include: saleInclude,
    });
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    return sale;
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.sale.delete({ where: { id } });
  }

  private async nextInvoiceNumber(organizationId: string) {
    const count = await this.prisma.sale.count({
      where: { orgId: organizationId },
    });
    return `SB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
}
