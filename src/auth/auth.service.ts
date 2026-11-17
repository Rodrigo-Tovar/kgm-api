import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import type { LoginDto } from './dto/login.dto';
import type { RolUsuario } from './auth.types';
import { PasswordService } from './password.service';
import { timingSafeEqual } from 'node:crypto';

const TOKEN_EXPIRATION_SECONDS = 900;
const DUMMY_PASSWORD_HASH =
  'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AyFkEa74U2k5-hZWArU4HwxSSWeHwGmG7_kjDaxKOGkS5MC4mF8ZuSaNpjRcFER_rsaaQZWxY2ZZTFRWahBI0Q';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly passwords: PasswordService,
  ) {}

  async iniciarSesion(dto: LoginDto) {
    const email = dto.email.trim().toLocaleLowerCase();
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: {
        administrador: true,
        docente: true,
        tutor: true,
      },
    });

    const passwordValido = await this.passwords.verificar(
      dto.password,
      usuario?.password ?? DUMMY_PASSWORD_HASH,
    );
    if (!usuario || !passwordValido) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const rol = usuario.rol as RolUsuario;
    const accessToken = await this.jwtService.signAsync({
      sub: usuario.id,
      escuelaId: usuario.escuelaId,
      rol,
    });
    const nombre =
      usuario.administrador?.nombre ??
      [
        usuario.docente?.nombre,
        usuario.docente?.apellidoPaterno,
        usuario.docente?.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(' ') ??
      [
        usuario.tutor?.nombre,
        usuario.tutor?.apellidoPaterno,
        usuario.tutor?.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(' ') ??
      usuario.email;

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: TOKEN_EXPIRATION_SECONDS,
      usuario: {
        id: usuario.id,
        escuelaId: usuario.escuelaId,
        email: usuario.email,
        rol,
        nombre,
      },
    };
  }

  async crearAdministradorInicial(dto: BootstrapAdminDto, secret?: string) {
    const configuredSecret = this.config.get<string>('ADMIN_BOOTSTRAP_SECRET');
    if (!configuredSecret || Buffer.byteLength(configuredSecret) < 32) {
      throw new ServiceUnavailableException(
        'El bootstrap administrativo no está configurado en el servidor.',
      );
    }

    const supplied = Buffer.from(secret ?? '');
    const expected = Buffer.from(configuredSecret);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      throw new UnauthorizedException('El secreto de bootstrap no es válido.');
    }

    const email = dto.email.trim().toLocaleLowerCase();
    const nombre = dto.nombre.trim();
    if (!nombre) {
      throw new ConflictException('El nombre del administrador es obligatorio.');
    }
    const password = await this.passwords.hash(dto.password);

    try {
      const usuario = await this.prisma.$transaction(
        async (tx) => {
          const escuela = await tx.escuela.findUnique({
            where: { id: dto.escuelaId },
            select: { id: true },
          });
          if (!escuela) {
            throw new ConflictException('La escuela indicada no existe.');
          }

          const administradorExistente = await tx.usuario.findFirst({
            where: {
              escuelaId: dto.escuelaId,
              rol: 'ADMINISTRADOR',
            },
            select: { id: true },
          });
          if (administradorExistente) {
            throw new ConflictException(
              'La escuela ya cuenta con un administrador. Usa el inicio de sesión.',
            );
          }

          return tx.usuario.create({
            data: {
              escuelaId: dto.escuelaId,
              email,
              password,
              rol: 'ADMINISTRADOR',
              administrador: {
                create: {
                  escuelaId: dto.escuelaId,
                  nombre,
                  telefono: dto.telefono?.trim() || null,
                },
              },
            },
            select: { id: true, escuelaId: true, email: true, rol: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return {
        id: usuario.id,
        escuelaId: usuario.escuelaId,
        email: usuario.email,
        rol: usuario.rol,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        throw new ConflictException(
          'El correo ya está registrado o el administrador inicial ya fue creado.',
        );
      }
      throw error;
    }
  }
}
