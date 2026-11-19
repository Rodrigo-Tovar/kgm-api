import { SetMetadata } from '@nestjs/common';
import type { RolUsuario } from './auth.types';

export const ROLES_REQUERIDOS = 'roles-requeridos';

export const Roles = (...roles: RolUsuario[]) =>
  SetMetadata(ROLES_REQUERIDOS, roles);
