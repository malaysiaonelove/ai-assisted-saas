import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { UsageModule } from '../usage/usage.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [CommonModule, UsageModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
