import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/auth-user.interface';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('reference') reference?: string) {
    return this.invoicesService.findAll(user.organizationId, reference);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoicesService.findOne(user.organizationId, id);
  }
}
