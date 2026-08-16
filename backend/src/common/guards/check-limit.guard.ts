import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService } from '../../usage/usage.service';
import { UsageKey } from '../../usage/usage.types';
import { CHECK_LIMIT_KEY } from '../decorators/check-limit.decorator';

@Injectable()
export class CheckLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<UsageKey>(CHECK_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!key) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    await this.usageService.enforce(
      request.user.organizationId,
      key,
    );

    return true;
  }
}
