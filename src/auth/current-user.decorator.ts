import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UsuarioAutenticado } from './auth.types';

type SolicitudAutenticada = Request & {
  user: UsuarioAutenticado;
};

export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioAutenticado =>
    context.switchToHttp().getRequest<SolicitudAutenticada>().user,
);
