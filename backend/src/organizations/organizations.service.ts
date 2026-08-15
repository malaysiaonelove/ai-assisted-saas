import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async getDashboard(organizationId: string) {
    const [organization, usage, subscription] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          users: {
            select: { id: true, username: true, email: true, role: true },
          },
        },
      }),
      this.usageService.getUsage(organizationId),
      this.subscriptionsService.getCurrent(organizationId),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthRevenue, monthSalesCount] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { orgId: organizationId, status: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      this.prisma.sale.count({
        where: { orgId: organizationId, createdAt: { gte: startOfMonth } },
      }),
    ]);

    const recentSales = await this.prisma.sale.findMany({
      where: { orgId: organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { name: true } },
        items: { select: { productName: true, quantity: true, total: true } },
      },
    });

    return {
      organization,
      subscription,
      usage,
      stats: {
        monthRevenue: monthRevenue._sum.total ?? 0,
        monthSalesCount,
      },
      recentSales,
    };
  }

  async rename(organizationId: string, name: string) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { name },
    });
  }
}
