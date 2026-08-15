import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateRole(organizationId: string, userId: string, dto: UpdateRoleDto, actorId: string) {
    if (userId === actorId) {
      throw new BadRequestException('You cannot change your own role');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: { id: true, username: true, email: true, role: true },
    });
  }
}
