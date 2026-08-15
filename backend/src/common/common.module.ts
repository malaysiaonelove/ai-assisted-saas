import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsageModule } from '../usage/usage.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CheckLimitGuard } from './guards/check-limit.guard';

@Module({
  imports: [AuthModule, UsageModule],
  providers: [JwtAuthGuard, RolesGuard, CheckLimitGuard],
  exports: [JwtAuthGuard, RolesGuard, CheckLimitGuard],
})
export class CommonModule {}
