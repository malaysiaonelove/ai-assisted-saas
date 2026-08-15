import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CheckLimitGuard } from '../common/guards/check-limit.guard';
import { CheckLimit } from '../common/decorators/check-limit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/auth-user.interface';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @UseGuards(CheckLimitGuard)
  @CheckLimit('customers')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.customersService.findAll(user.organizationId, search);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customersService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customersService.remove(user.organizationId, id);
  }
}
