import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CheckLimitGuard } from '../common/guards/check-limit.guard';
import { CheckLimit } from '../common/decorators/check-limit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/auth-user.interface';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(CheckLimitGuard)
  @CheckLimit('monthlySales')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user.organizationId, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesService.findAll(user.organizationId, search, limit ? Number(limit) : undefined);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.salesService.findOne(user.organizationId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.salesService.remove(user.organizationId, id);
  }
}
