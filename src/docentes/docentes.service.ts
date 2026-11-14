import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { ActualizarDocenteDto } from './dto/actualizar-docente.dto';
import { CrearDocenteDto } from './dto/crear-docente.dto';
import { PrismaService } from '../prisma/prisma.service';

type DocenteConAsignaciones = Prisma.DocenteGetPayload<{
  include: {
    asignacionacademica: {
      include: {
        grupo: { include: { grado: true } };
        ciclo: true;
        materia: true;
      };
    };
  };
}>;

function normalizarEstado(estado: string): 'ACTIVO' | 'INACTIVO' {
  return estado.toLocaleUpperCase() === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
}

@Injectable()
export class DocentesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(escuelaId: number) {
    await this.validarEscuela(escuelaId);
    const docentes = await this.prisma.docente.findMany({
      where: { escuelaId },
      include: {
        asignacionacademica: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
          include: {
            grupo: { include: { grado: true } },
            ciclo: true,
            materia: true,
          },
        },
      },
      orderBy: [{ apellidoPaterno: 'asc' }, { nombre: 'asc' }],
    });

    return docentes.map((docente) => this.mapearDocente(docente));
  }

  async obtenerPorId(id: number, escuelaId: number) {
    await this.validarEscuela(escuelaId);
    const docente = await this.prisma.docente.findFirst({
      where: { id, escuelaId },
      include: {
        asignacionacademica: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
          include: {
            grupo: { include: { grado: true } },
            ciclo: true,
            materia: true,
          },
        },
      },
    });

    if (!docente) {
      throw new NotFoundException(`Docente con id ${id} no encontrado`);
    }

    return this.mapearDocente(docente);
  }

  async crear(dto: CrearDocenteDto, foto?: Express.Multer.File) {
    try {
      const curp = dto.curp.trim().toUpperCase();
      const correo = dto.correo.trim().toLocaleLowerCase();
      await this.validarEscuela(dto.escuelaId);

      const duplicado = await this.prisma.docente.findFirst({
        where: {
          escuelaId: dto.escuelaId,
          OR: [{ curp }, { correo }],
        },
        select: { curp: true, correo: true },
      });

      if (duplicado?.curp === curp) {
        throw new ConflictException(
          'Ya existe un docente con esta CURP en la escuela.',
        );
      }
      if (duplicado?.correo?.toLocaleLowerCase() === correo) {
        throw new ConflictException(
          'Ya existe un docente con este correo en la escuela.',
        );
      }

      const docente = await this.prisma.docente.create({
        data: {
          escuelaId: dto.escuelaId,
          nombre: dto.nombre.trim(),
          apellidoPaterno: dto.apellidoPaterno.trim(),
          apellidoMaterno: dto.apellidoMaterno?.trim() || null,
          curp,
          fechaNacimiento: new Date(dto.fechaNacimiento),
          estado: normalizarEstado(dto.estado),
          telefono: dto.telefono.trim(),
          correo,
          direccion: dto.direccion.trim(),
          fotoUrl: foto ? `/uploads/docentes/${foto.filename}` : null,
        },
        include: {
          asignacionacademica: {
            where: { activo: true },
            include: {
              grupo: { include: { grado: true } },
              ciclo: true,
              materia: true,
            },
          },
        },
      });

      return this.mapearDocente(docente);
    } catch (error) {
      if (foto) {
        await unlink(foto.path);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un docente con esta CURP o correo en la escuela.',
        );
      }
      throw error;
    }
  }

  async actualizar(
    id: number,
    escuelaId: number,
    dto: ActualizarDocenteDto,
    foto?: Express.Multer.File,
  ) {
    let guardado = false;
    let fotoAnterior: string | null = null;
    try {
      const actual = await this.prisma.docente.findFirst({
        where: { id, escuelaId },
        select: { id: true, fotoUrl: true },
      });
      if (!actual) {
        throw new NotFoundException(`Docente con id ${id} no encontrado`);
      }
      fotoAnterior = actual.fotoUrl;

      const curp = dto.curp?.trim().toUpperCase();
      const correo = dto.correo?.trim().toLocaleLowerCase();
      if (curp || correo) {
        const duplicado = await this.prisma.docente.findFirst({
          where: {
            escuelaId,
            id: { not: id },
            OR: [...(curp ? [{ curp }] : []), ...(correo ? [{ correo }] : [])],
          },
          select: { id: true },
        });
        if (duplicado) {
          throw new ConflictException(
            'Ya existe otro docente con esa CURP o correo en la escuela.',
          );
        }
      }

      await this.prisma.docente.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
          ...(dto.apellidoPaterno !== undefined
            ? { apellidoPaterno: dto.apellidoPaterno.trim() }
            : {}),
          ...(dto.apellidoMaterno !== undefined
            ? { apellidoMaterno: dto.apellidoMaterno.trim() || null }
            : {}),
          ...(curp ? { curp } : {}),
          ...(dto.fechaNacimiento
            ? { fechaNacimiento: new Date(dto.fechaNacimiento) }
            : {}),
          ...(dto.estado ? { estado: normalizarEstado(dto.estado) } : {}),
          ...(dto.telefono !== undefined
            ? { telefono: dto.telefono.trim() }
            : {}),
          ...(correo ? { correo } : {}),
          ...(dto.direccion !== undefined
            ? { direccion: dto.direccion.trim() }
            : {}),
          ...(foto ? { fotoUrl: `/uploads/docentes/${foto.filename}` } : {}),
        },
      });
      guardado = true;

      if (foto && fotoAnterior) {
        await this.eliminarFoto(fotoAnterior);
      }
      return this.obtenerPorId(id, escuelaId);
    } catch (error) {
      if (foto && !guardado) await unlink(foto.path);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe otro docente con esa CURP o correo en la escuela.',
        );
      }
      throw error;
    }
  }

  private async eliminarFoto(ruta: string) {
    const nombreArchivo = ruta.split('/').pop();
    if (!nombreArchivo) return;
    try {
      await unlink(join(process.cwd(), 'uploads', 'docentes', nombreArchivo));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }
      throw error;
    }
  }

  private async validarEscuela(escuelaId: number) {
    const escuela = await this.prisma.escuela.findUnique({
      where: { id: escuelaId },
      select: { id: true },
    });
    if (!escuela) {
      throw new NotFoundException(`Escuela con id ${escuelaId} no encontrada`);
    }
  }

  private mapearDocente(docente: DocenteConAsignaciones) {
    const asignacion = docente.asignacionacademica[0];
    return {
      id: docente.id,
      escuelaId: docente.escuelaId,
      nombre: docente.nombre,
      apellidoPaterno: docente.apellidoPaterno,
      apellidoMaterno: docente.apellidoMaterno,
      nombreCompleto: [
        docente.nombre,
        docente.apellidoPaterno,
        docente.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(' '),
      curp: docente.curp,
      fechaNacimiento:
        docente.fechaNacimiento?.toISOString().slice(0, 10) ?? null,
      estado: docente.estado === 'INACTIVO' ? 'Inactivo' : 'Activo',
      telefono: docente.telefono,
      correo: docente.correo,
      direccion: docente.direccion,
      foto: docente.fotoUrl,
      asignacion: asignacion
        ? `${asignacion.grupo.grado.nombre} ${asignacion.grupo.nombre}`
        : null,
      ciclo: asignacion?.ciclo.nombre ?? 'Sin ciclo asignado',
      asignaciones: docente.asignacionacademica.map((carga) => ({
        id: carga.id,
        cicloId: carga.cicloId,
        cicloEscolar:
          carga.ciclo.nombre ??
          `${carga.ciclo.fechaInicio.getUTCFullYear()}-${carga.ciclo.fechaFin.getUTCFullYear()}`,
        grupoId: carga.grupoId,
        grupo: carga.grupo.nombre,
        gradoId: carga.grupo.gradoId,
        grado: carga.grupo.grado.nombre,
        materiaId: carga.materiaId,
        materia: carga.materia.nombre,
        claveMateria: carga.materia.clave,
        activo: carga.activo ?? false,
      })),
    };
  }
}
