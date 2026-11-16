import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearGradoDto } from './dto/crear-grado.dto';
import { CrearGrupoDto } from './dto/crear-grupo.dto';
import { ActualizarGrupoDto } from './dto/actualizar-grupo.dto';

@Injectable()
export class GradosGruposService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarEscuela(escuelaId: number) {
    const escuela = await this.prisma.escuela.findUnique({
      where: { id: escuelaId },
      select: { id: true },
    });

    if (!escuela) {
      throw new NotFoundException(`La escuela con ID ${escuelaId} no existe.`);
    }
  }

  // --- GRADOS ---

  async listarGrados(escuelaId: number) {
    await this.validarEscuela(escuelaId);

    return this.prisma.grado.findMany({
      where: { escuelaId },
      include: {
        _count: { select: { grupo: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async crearGrado(escuelaId: number, dto: CrearGradoDto) {
    await this.validarEscuela(escuelaId);

    const nombreLimpio = dto.nombre.trim();

    const existe = await this.prisma.grado.findFirst({
      where: {
        escuelaId,
        nombre: { equals: nombreLimpio, mode: 'insensitive' },
      },
    });

    if (existe) {
      throw new ConflictException(`El grado "${nombreLimpio}" ya existe en esta escuela.`);
    }

    return this.prisma.grado.create({
      data: {
        escuelaId,
        nombre: nombreLimpio,
      },
    });
  }

  // --- GRUPOS ---

  async listarGruposPorGrado(
    escuelaId: number,
    gradoId: number,
    cicloId?: number,
  ) {
    await this.validarEscuela(escuelaId);

    const grado = await this.prisma.grado.findFirst({
      where: { id: gradoId, escuelaId },
    });

    if (!grado) {
      throw new NotFoundException(`El grado con ID ${gradoId} no fue encontrado.`);
    }

    const grupos = await this.prisma.grupo.findMany({
      where: { escuelaId, gradoId },
      include: {
        grado: true,
        _count: {
          select: {
            alumnogrupo: cicloId
              ? { where: { cicloId, activo: true } }
              : { where: { activo: true } },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return grupos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      turno: g.turno || 'Sin turno',
      capacidad: g.capacidad,
      grado: g.grado.nombre,
      alumnosAsignados: g._count.alumnogrupo,
      docenteAsignado: 'Sin docente asignado',
    }));
  }

  async crearGrupo(escuelaId: number, dto: CrearGrupoDto) {
    await this.validarEscuela(escuelaId);

    const grado = await this.prisma.grado.findFirst({
      where: { id: dto.gradoId, escuelaId },
    });

    if (!grado) {
      throw new NotFoundException(`El grado con ID ${dto.gradoId} no existe en esta escuela.`);
    }

    const nombreLimpio = dto.nombre.trim();

    const existeGrupo = await this.prisma.grupo.findFirst({
      where: {
        escuelaId,
        gradoId: dto.gradoId,
        nombre: { equals: nombreLimpio, mode: 'insensitive' },
      },
    });

    if (existeGrupo) {
      throw new ConflictException(
        `Ya existe el grupo "${nombreLimpio}" asignado al grado "${grado.nombre}".`,
      );
    }

    return this.prisma.grupo.create({
      data: {
        escuelaId,
        gradoId: dto.gradoId,
        nombre: nombreLimpio,
        turno: dto.turno?.trim(),
        capacidad: dto.capacidad ?? 30,
      },
    });
  }

  // --- EDITAR GRADO ---
async actualizarGrado(escuelaId: number, gradoId: number, dto: CrearGradoDto) {
  await this.validarEscuela(escuelaId);

  const grado = await this.prisma.grado.findFirst({
    where: { id: gradoId, escuelaId },
  });

  if (!grado) {
    throw new NotFoundException(`El grado con ID ${gradoId} no fue encontrado.`);
  }

  const nombreLimpio = dto.nombre.trim();

  const conflicto = await this.prisma.grado.findFirst({
    where: {
      escuelaId,
      nombre: { equals: nombreLimpio, mode: 'insensitive' },
      id: { not: gradoId },
    },
  });

  if (conflicto) {
    throw new ConflictException(`Ya existe otro grado con el nombre "${nombreLimpio}".`);
  }

  return this.prisma.grado.update({
    where: { id: gradoId },
    data: { nombre: nombreLimpio },
  });
}

// --- EDITAR GRUPO ---
async actualizarGrupo(escuelaId: number, grupoId: number, dto: ActualizarGrupoDto) {
  await this.validarEscuela(escuelaId);

  const grupo = await this.prisma.grupo.findFirst({
    where: { id: grupoId, escuelaId },
  });

  if (!grupo) {
    throw new NotFoundException(`El grupo con ID ${grupoId} no fue encontrado.`);
  }

  if (dto.nombre) {
    const nombreLimpio = dto.nombre.trim();
    const conflicto = await this.prisma.grupo.findFirst({
      where: {
        escuelaId,
        gradoId: grupo.gradoId,
        nombre: { equals: nombreLimpio, mode: 'insensitive' },
        id: { not: grupoId },
      },
    });

    if (conflicto) {
      throw new ConflictException(`Ya existe el grupo "${nombreLimpio}" en este grado.`);
    }
  }

  return this.prisma.grupo.update({
    where: { id: grupoId },
    data: {
      ...(dto.nombre ? { nombre: dto.nombre.trim() } : {}),
      ...(dto.turno !== undefined ? { turno: dto.turno.trim() } : {}),
      ...(dto.capacidad ? { capacidad: dto.capacidad } : {}),
    },
  });
}
}