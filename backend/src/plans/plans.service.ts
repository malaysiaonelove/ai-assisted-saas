import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }
}
