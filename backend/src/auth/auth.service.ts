import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/auth-user.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt.strategy';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });
    if (existing) {
      throw new ConflictException('Username or email is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const now = new Date();

    const user = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName },
      });
      const freePlan = await tx.plan.findUnique({ where: { slug: 'free' } });
      if (!freePlan) {
        throw new Error('Free plan not found. Run the seed script first.');
      }
      const created = await tx.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          passwordHash,
          role: 'OWNER',
          organizationId: organization.id,
        },
      });
      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: addMonths(now, 1),
        },
      });
      return created;
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.identifier }, { email: dto.identifier }],
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: {
    id: string;
    username: string;
    email: string;
    role: string;
    organizationId: string;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as AuthUser['role'],
      organizationId: user.organizationId,
    };
    return { accessToken, user: authUser };
  }
}
