import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { UsageModule } from '../usage/usage.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [CommonModule, UsageModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
