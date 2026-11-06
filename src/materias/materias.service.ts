import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarMateriaDto } from './dto/actualizar-materia.dto';
import { CrearMateriaDto } from './dto/crear-materia.dto';
import { ListarMateriasQueryDto } from './dto/listar-materias-query.dto';

type MateriaConGrado = Prisma.MateriaGetPayload<{
  include: { grado: true };
}>;

@Injectable()
export class MateriasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarMateriasQueryDto) {
    await this.validarEscuela(query.escuelaId);

    const busqueda = query.busqueda?.trim();
    const materias = await this.prisma.materia.findMany({
      where: {
        escuelaId: query.escuelaId,
        ...(query.gradoId ? { gradoId: query.gradoId } : {}),
        ...(busqueda
          ? { nombre: { contains: busqueda, mode: 'insensitive' } }
          : {}),
      },
      include: { grado: true },
      orderBy: [{ grado: { nombre: 'asc' } }, { nombre: 'asc' }],
    });

    return materias.map((materia) => this.mapearMateria(materia));
  }

  async obtenerOpciones(escuelaId: number) {
    await this.validarEscuela(escuelaId);

    const grados = await this.prisma.grado.findMany({
      where: { escuelaId },
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true },
    });

    return { grados };
  }

  async obtenerPorId(id: number, escuelaId: number) {
    await this.validarEscuela(escuelaId);

    const materia = await this.prisma.materia.findFirst({
      where: { id, escuelaId },
      include: { grado: true },
    });

    if (!materia) {
      throw new NotFoundException(`Materia con id ${id} no encontrada`);
    }

    return this.mapearMateria(materia);
  }

  async crear(dto: CrearMateriaDto) {
    const nombre = dto.nombre.trim();
    const clave = dto.clave.trim();

    await this.validarEscuela(dto.escuelaId);
    await this.validarGrado(dto.gradoId, dto.escuelaId);
    await this.validarNombreUnico(dto.escuelaId, dto.gradoId, nombre);
    await this.validarClaveUnica(dto.escuelaId, clave);

    const materia = await this.prisma.materia.create({
      data: {
        escuelaId: dto.escuelaId,
        gradoId: dto.gradoId,
        clave,
        nombre,
      },
      include: { grado: true },
    });

    return this.mapearMateria(materia);
  }

  async actualizar(
    id: number,
    escuelaId: number,
    dto: ActualizarMateriaDto,
  ) {
    await this.validarEscuela(escuelaId);

    const actual = await this.prisma.materia.findFirst({
      where: { id, escuelaId },
      select: { id: true, gradoId: true, clave: true, nombre: true },
    });

    if (!actual) {
      throw new NotFoundException(`Materia con id ${id} no encontrada`);
    }

    const gradoId = dto.gradoId ?? actual.gradoId;
    const nombre = dto.nombre?.trim() ?? actual.nombre;
    const clave = dto.clave?.trim() ?? actual.clave;

    if (dto.gradoId !== undefined && dto.gradoId !== actual.gradoId) {
      await this.validarGrado(gradoId, escuelaId);
    }

    if (dto.nombre !== undefined || gradoId !== actual.gradoId) {
      await this.validarNombreUnico(escuelaId, gradoId, nombre, id);
    }

    if (dto.clave !== undefined) {
      await this.validarClaveUnica(escuelaId, clave, id);
    }

    await this.prisma.materia.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre } : {}),
        ...(dto.clave !== undefined ? { clave } : {}),
        ...(dto.gradoId !== undefined ? { gradoId } : {}),
      },
    });

    return this.obtenerPorId(id, escuelaId);
  }

  async eliminar(id: number, escuelaId: number) {
    await this.validarEscuela(escuelaId);

    const materia = await this.prisma.materia.findFirst({
      where: { id, escuelaId },
      select: { id: true },
    });

    if (!materia) {
      throw new NotFoundException(`Materia con id ${id} no encontrada`);
    }

    const asignaciones = await this.prisma.asignacionAcademica.count({
      where: { materiaId: id },
    });

    if (asignaciones > 0) {
      throw new ConflictException(
        'No se puede eliminar la materia porque tiene asignaciones académicas asociadas.',
      );
    }

    await this.prisma.materia.delete({ where: { id } });

    return { id, mensaje: 'Materia eliminada correctamente' };
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

  private async validarGrado(gradoId: number, escuelaId: number) {
    const grado = await this.prisma.grado.findFirst({
      where: { id: gradoId, escuelaId },
      select: { id: true },
    });

    if (!grado) {
      throw new BadRequestException(
        'El grado seleccionado no existe en la escuela',
      );
    }
  }

  private async validarNombreUnico(
    escuelaId: number,
    gradoId: number,
    nombre: string,
    excluirId?: number,
  ) {
    const duplicado = await this.prisma.materia.findFirst({
      where: {
        escuelaId,
        gradoId,
        nombre: { equals: nombre, mode: 'insensitive' },
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
      select: { id: true },
    });

    if (duplicado) {
      throw new ConflictException(
        'Ya existe una materia con ese nombre en el grado seleccionado.',
      );
    }
  }

  private async validarClaveUnica(
    escuelaId: number,
    clave: string,
    excluirId?: number,
  ) {
    const duplicado = await this.prisma.materia.findFirst({
      where: {
        escuelaId,
        clave: { equals: clave, mode: 'insensitive' },
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
      select: { id: true },
    });

    if (duplicado) {
      throw new ConflictException(
        'Ya existe una materia con esa clave en la escuela.',
      );
    }
  }

  private mapearMateria(materia: MateriaConGrado) {
    return {
      id: materia.id,
      escuelaId: materia.escuelaId,
      gradoId: materia.gradoId,
      grado: materia.grado.nombre,
      clave: materia.clave,
      nombre: materia.nombre,
      createdAt: materia.createdAt?.toISOString() ?? null,
    };
  }
}
