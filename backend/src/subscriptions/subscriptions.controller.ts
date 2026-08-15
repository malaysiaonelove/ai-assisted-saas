import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/auth-user.interface';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  getCurrent(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.getCurrent(user.organizationId);
  }

  @Post('checkout')
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.subscriptionsService.checkout(
      user.organizationId,
      user.email,
      dto.planId,
    );
  }

  @Post('me/cancel')
  cancel(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.cancel(user.organizationId);
  }
}
