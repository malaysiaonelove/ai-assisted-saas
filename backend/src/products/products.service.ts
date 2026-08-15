import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { orgId: organizationId, ...dto },
    });
  }

  findAll(organizationId: string, search?: string) {
    return this.prisma.product.findMany({
      where: {
        orgId: organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, orgId: organizationId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(organizationId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(organizationId, id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.product.delete({ where: { id } });
  }
}
