import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: { orgId: organizationId, ...dto },
    });
  }

  findAll(organizationId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        orgId: organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sales: true } } },
    });
  }

  async findOne(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, orgId: organizationId },
      include: { _count: { select: { sales: true } } },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(organizationId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(organizationId, id);
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.customer.delete({ where: { id } });
  }
}
