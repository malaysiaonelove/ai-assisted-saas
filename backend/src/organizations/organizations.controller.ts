import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/auth-user.interface';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.organizationsService.getDashboard(user.organizationId);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  rename(@CurrentUser() user: AuthUser, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.rename(user.organizationId, dto.name);
  }
}
