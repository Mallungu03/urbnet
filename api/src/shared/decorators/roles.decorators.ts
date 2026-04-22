import { SetMetadata } from '@nestjs/common';

export enum Role {
  Citizen = 'citizen',
  Admin = 'admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
