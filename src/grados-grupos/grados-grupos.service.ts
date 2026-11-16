import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearGradoDto } from './dto/crear-grado.dto';
import { CrearGrupoDto } from './dto/crear-grupo.dto';

@Injectable()
export class GradosGruposService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Listar todos los grados con el conteo de grupos
  async listarGrados(escuelaId: number) {
    return this.prisma.grado.findMany({
      where: { escuelaId },
      include: {
        _count: { select: { grupo: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  // 2. Crear Grado (Acepta CrearGradoDto)
  async crearGrado(escuelaId: number, dto: CrearGradoDto) {
    const existe = await this.prisma.grado.findFirst({
      where: { escuelaId, nombre: dto.nombre.trim() },
    });

    if (existe) {
      throw new ConflictException(`El grado "${dto.nombre}" ya existe.`);
    }

    return this.prisma.grado.create({
      data: {
        escuelaId,
        nombre: dto.nombre.trim(),
      },
    });
  }

  // 3. Listar Grupos por Grado (Cálculo de alumnos y docente)
  async listarGruposPorGrado(
    escuelaId: number,
    gradoId: number,
    cicloId?: number,
  ) {
    const grupos = await this.prisma.grupo.findMany({
      where: { escuelaId, gradoId },
      include: {
        grado: true,
        _count: {
          select: {
            alumnogrupo: cicloId ? { where: { cicloId } } : true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return grupos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      turno: g.turno || 'Sin turno',
      grado: g.grado.nombre,
      alumnosAsignados: g._count.alumnogrupo,
      docenteAsignado: 'Sin docente asignado',
    }));
  }

  // 4. Crear Grupo (Acepta CrearGrupoDto)
  async crearGrupo(escuelaId: number, dto: CrearGrupoDto) {
    const grado = await this.prisma.grado.findFirst({
      where: { id: dto.gradoId, escuelaId },
    });

    if (!grado) {
      throw new NotFoundException(`El grado con ID ${dto.gradoId} no existe.`);
    }

    const existeGrupo = await this.prisma.grupo.findFirst({
      where: { escuelaId, gradoId: dto.gradoId, nombre: dto.nombre.trim() },
    });

    if (existeGrupo) {
      throw new ConflictException(
        `Ya existe el grupo "${dto.nombre}" en este grado.`,
      );
    }

    return this.prisma.grupo.create({
      data: {
        escuelaId,
        gradoId: dto.gradoId,
        nombre: dto.nombre.trim(),
        turno: dto.turno,
      },
    });
  }
}