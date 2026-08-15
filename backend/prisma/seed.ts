import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'For trying out SalesBook — record up to 50 sales a month.',
      price: 0,
      features: { teamMembers: 1, reports: false },
      limits: { customers: 20, products: 10, monthlySales: 50 },
      sortOrder: 1,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'For growing SMEs — more customers, products and sales.',
      price: 5000,
      features: { teamMembers: 3, reports: true },
      limits: { customers: 200, products: 100, monthlySales: 500 },
      sortOrder: 2,
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'For established businesses — unlimited everything.',
      price: 15000,
      features: { teamMembers: 10, reports: true },
      limits: { customers: null, products: null, monthlySales: null },
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`Plan "${plan.name}" ready.`);
  }

  // Demo organization + user so the app can be tried immediately.
  const email = 'demo@salesbook.app';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const organization = await prisma.organization.create({
      data: { name: 'Demo Business' },
    });
    const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });
    const now = new Date();
    await prisma.user.create({
      data: {
        email,
        username: 'demo',
        passwordHash: await bcrypt.hash('demo1234', 10),
        role: 'OWNER',
        organizationId: organization.id,
      },
    });
    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planId: freePlan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: addMonths(now, 1),
      },
    });
    console.log('Demo user created -> username: demo / password: demo1234');
  } else {
    console.log('Demo user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
