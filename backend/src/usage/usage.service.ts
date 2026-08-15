import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageData, UsageKey } from './usage.types';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns current resource usage and the active plan's limits for an org.
   * A limit of `null` means unlimited.
   */
  async getUsage(organizationId: string): Promise<UsageData> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [customers, products, monthlySales, subscription] = await Promise.all([
      this.prisma.customer.count({ where: { orgId: organizationId } }),
      this.prisma.product.count({ where: { orgId: organizationId } }),
      this.prisma.sale.count({
        where: { orgId: organizationId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.subscription.findFirst({
        where: { organizationId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      }),
    ]);

    const plan = subscription?.plan ?? null;
    const limits = (plan?.limits ?? {}) as Record<UsageKey, number | null>;

    return {
      usage: { customers, products, monthlySales },
      limits,
      plan: plan
        ? { id: plan.id, name: plan.name, slug: plan.slug }
        : null,
    };
  }

  /**
   * Throws ForbiddenException when the org has reached the limit for `key`.
   */
  async enforce(organizationId: string, key: UsageKey): Promise<void> {
    const data = await this.getUsage(organizationId);
    const limit = data.limits[key];
    if (limit != null && data.usage[key] >= limit) {
      throw new ForbiddenException(
        `Plan limit reached: ${key} (${data.usage[key]}/${limit}). Please upgrade your plan.`,
      );
    }
  }
}
