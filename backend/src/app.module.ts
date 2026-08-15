import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { UsageModule } from './usage/usage.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    PlansModule,
    SubscriptionsModule,
    PaymentsModule,
    InvoicesModule,
    UsageModule,
    CustomersModule,
    ProductsModule,
    SalesModule,
  ],
})
export class AppModule {}
