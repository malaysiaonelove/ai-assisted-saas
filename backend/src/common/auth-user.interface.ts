import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  organizationId: string;
}
