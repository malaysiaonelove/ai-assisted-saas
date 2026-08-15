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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CheckLimitGuard } from '../common/guards/check-limit.guard';
import { CheckLimit } from '../common/decorators/check-limit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/auth-user.interface';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(CheckLimitGuard)
  @CheckLimit('products')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.productsService.findAll(user.organizationId, search);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.productsService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.productsService.remove(user.organizationId, id);
  }
}
