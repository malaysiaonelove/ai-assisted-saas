import { SetMetadata } from '@nestjs/common';
import { UsageKey } from '../../usage/usage.types';

export const CHECK_LIMIT_KEY = 'check_limit';
export const CheckLimit = (key: UsageKey) => SetMetadata(CHECK_LIMIT_KEY, key);
