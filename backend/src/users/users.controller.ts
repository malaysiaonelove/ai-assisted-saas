import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/auth-user.interface';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.usersService.findAll(user.organizationId);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  updateRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(user.organizationId, id, dto, user.id);
  }
}
