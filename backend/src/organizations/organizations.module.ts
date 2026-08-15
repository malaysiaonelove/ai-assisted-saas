import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsageModule } from '../usage/usage.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [CommonModule, SubscriptionsModule, UsageModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
