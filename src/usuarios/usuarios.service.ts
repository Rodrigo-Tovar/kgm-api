import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { unlink } from 'node:fs/promises';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';
import type { UsuarioAutenticado } from '../auth/auth.types';
import type { CrearUsuarioDto } from './dto/crear-usuario.dto';
import {
  guardarFotoAdministrador,
  type FotoAdministradorGuardada,
} from './usuarios.storage';

type PerfilUsuario = {
  id: number;
  nombreCompleto: string;
  correo: string;
  curp: string | null;
  telefono: string | null;
  foto: string | null;
};

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async listarOpciones(
    escuelaId: number,
    rol: 'DOCENTE' | 'TUTOR',
  ): Promise<PerfilUsuario[]> {
    if (rol === 'DOCENTE') {
      const docentes = await this.prisma.docente.findMany({
        where: {
          escuelaId,
          usuarioId: null,
          estado: 'ACTIVO',
          correo: { not: null },
        },
        orderBy: [{ apellidoPaterno: 'asc' }, { nombre: 'asc' }],
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          correo: true,
          curp: true,
          telefono: true,
          fotoUrl: true,
        },
      });

      return docentes
        .filter((docente) => Boolean(docente.correo?.trim()))
        .map((docente) => ({
          id: docente.id,
          nombreCompleto: [
            docente.nombre,
            docente.apellidoPaterno,
            docente.apellidoMaterno,
          ]
            .filter(Boolean)
            .join(' '),
          correo: docente.correo!.trim(),
          curp: docente.curp,
          telefono: docente.telefono,
          foto: docente.fotoUrl,
        }));
    }

    const tutores = await this.prisma.tutor.findMany({
      where: {
        escuelaId,
        usuarioId: null,
        correo: { not: null },
      },
      orderBy: [{ apellidoPaterno: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        curp: true,
        telefono: true,
      },
    });

    return tutores
      .filter((tutor) => Boolean(tutor.correo?.trim()))
      .map((tutor) => ({
        id: tutor.id,
        nombreCompleto: [
          tutor.nombre,
          tutor.apellidoPaterno,
          tutor.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(' '),
        correo: tutor.correo!.trim(),
        curp: tutor.curp,
        telefono: tutor.telefono,
        foto: null,
      }));
  }

  async crear(
    actual: UsuarioAutenticado,
    dto: CrearUsuarioDto,
    foto?: Express.Multer.File,
  ) {
    let fotoGuardada: FotoAdministradorGuardada | undefined;
    let archivoConservado = false;
    try {
      if (!dto.password) {
        throw new UnprocessableEntityException(
          'La contraseña inicial es obligatoria.',
        );
      }
      const password = await this.passwords.hash(dto.password);
      let resultado: {
        id: number;
        escuelaId: number;
        email: string;
        rol: string;
        createdAt: Date | null;
      };

      if (dto.rol === 'ADMINISTRADOR') {
        if (!dto.nombre?.trim() || !dto.email?.trim()) {
          throw new UnprocessableEntityException(
            'El nombre y el correo institucional son obligatorios para el administrador.',
          );
        }
        if (foto) fotoGuardada = await guardarFotoAdministrador(foto);

        resultado = await this.prisma.usuario.create({
          data: {
            escuelaId: actual.escuelaId,
            email: dto.email.trim().toLocaleLowerCase(),
            password,
            rol: dto.rol,
            administrador: {
              create: {
                escuelaId: actual.escuelaId,
                nombre: dto.nombre.trim(),
                telefono: dto.telefono?.trim() || null,
                fotoUrl: fotoGuardada?.url ?? null,
              },
            },
          },
          select: {
            id: true,
            escuelaId: true,
            email: true,
            rol: true,
            createdAt: true,
          },
        });
        archivoConservado = Boolean(foto);
      } else {
        if (!dto.perfilId) {
          throw new UnprocessableEntityException(
            'Selecciona un perfil registrado.',
          );
        }
        if (foto) {
          throw new UnprocessableEntityException(
            'La foto solo se permite al crear un administrador.',
          );
        }
        resultado = await this.crearUsuarioVinculado(
          actual.escuelaId,
          dto.rol,
          dto.perfilId,
          password,
        );
      }

      return {
        id: resultado.id,
        escuelaId: resultado.escuelaId,
        email: resultado.email,
        rol: resultado.rol,
        createdAt: resultado.createdAt,
      };
    } catch (error) {
      if (fotoGuardada && !archivoConservado) {
        await unlink(fotoGuardada.ruta);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Este correo ya está en uso. No se creó ningún usuario.',
        );
      }
      throw error;
    }
  }

  private async crearUsuarioVinculado(
    escuelaId: number,
    rol: 'DOCENTE' | 'TUTOR',
    perfilId: number,
    password: string,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const perfil =
          rol === 'DOCENTE'
            ? await tx.docente.findFirst({
                where: {
                  id: perfilId,
                  escuelaId,
                  usuarioId: null,
                  estado: 'ACTIVO',
                  correo: { not: null },
                },
                select: { id: true, correo: true },
              })
            : await tx.tutor.findFirst({
                where: {
                  id: perfilId,
                  escuelaId,
                  usuarioId: null,
                  correo: { not: null },
                },
                select: { id: true, correo: true },
              });

        if (!perfil) {
          throw new NotFoundException(
            'No se encontró el perfil en la escuela autenticada.',
          );
        }
        if (!perfil.correo?.trim()) {
          throw new ConflictException(
            'El perfil no cuenta con un correo registrado.',
          );
        }

        const usuario = await tx.usuario.create({
          data: {
            escuelaId,
            email: perfil.correo.trim().toLocaleLowerCase(),
            password,
            rol,
          },
          select: {
            id: true,
            escuelaId: true,
            email: true,
            rol: true,
            createdAt: true,
          },
        });

        const actualizado =
          rol === 'DOCENTE'
            ? await tx.docente.updateMany({
                where: {
                  id: perfil.id,
                  escuelaId,
                  usuarioId: null,
                  estado: 'ACTIVO',
                },
                data: { usuarioId: usuario.id },
              })
            : await tx.tutor.updateMany({
                where: { id: perfil.id, escuelaId, usuarioId: null },
                data: { usuarioId: usuario.id },
              });

        if (actualizado.count !== 1) {
          throw new ConflictException(
            'El perfil ya fue vinculado a otro usuario. Actualiza la lista e inténtalo de nuevo.',
          );
        }

        return usuario;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Este correo ya está en uso o el perfil ya cuenta con un usuario.',
        );
      }
      throw error;
    }
  }

}
