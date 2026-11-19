import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { RolUsuario, UsuarioAutenticado } from './auth.types';

function esRolUsuario(valor: unknown): valor is RolUsuario {
  return (
    valor === 'ADMINISTRADOR' || valor === 'DOCENTE' || valor === 'TUTOR'
  );
}

type SolicitudAutenticada = Request & {
  user?: UsuarioAutenticado;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SolicitudAutenticada>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Debes iniciar sesión para continuar.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        UsuarioAutenticado & { exp: number }
      >(token);
      if (
        !Number.isInteger(payload.sub) ||
        !Number.isInteger(payload.escuelaId) ||
        !esRolUsuario(payload.rol)
      ) {
        throw new UnauthorizedException('La sesión no es válida.');
      }

      request.user = {
        sub: payload.sub,
        escuelaId: payload.escuelaId,
        rol: payload.rol,
      };
      return true;
    } catch {
      throw new UnauthorizedException('La sesión no es válida o expiró.');
    }
  }
}
