import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCicloEscolarDto } from './dto/crear-ciclo-escolar.dto';

@Injectable()
export class CiclosEscolaresService {
  constructor(private readonly prisma: PrismaService) {}

  // Consulta de ciclos por escuela (HU-2.1)
  async listar(escuelaId: number, estado?: string) {
    await this.validarEscuela(escuelaId);

    return this.prisma.cicloEscolar.findMany({
      where: {
        escuelaId,
        ...(estado && estado !== 'Todos' ? { estado } : {}),
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  // Crear ciclo escolar evitando duplicados y manejando el estado único Activo (HU-2.1)
  async crear(escuelaId: number, dto: CrearCicloEscolarDto) {
    await this.validarEscuela(escuelaId);
    this.validarRangoFechas(dto.fechaInicio, dto.fechaFin);

    const existeNombre = await this.prisma.cicloEscolar.findFirst({
      where: {
        escuelaId,
        nombre: dto.nombre.trim(),
      },
    });

    if (existeNombre) {
      throw new ConflictException(
        `Ya existe un ciclo escolar con el nombre "${dto.nombre}" en esta institución.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Si el nuevo ciclo se crea como 'Activo', cerramos automáticamente los anteriores
      if (dto.estado === 'Activo') {
        await tx.cicloEscolar.updateMany({
          where: { escuelaId, estado: 'Activo' },
          data: { estado: 'Cerrado' },
        });
      }

      return tx.cicloEscolar.create({
        data: {
          escuelaId,
          nombre: dto.nombre.trim(),
          fechaInicio: new Date(dto.fechaInicio),
          fechaFin: new Date(dto.fechaFin),
          estado: dto.estado,
        },
      });
    });
  }

  private async validarEscuela(escuelaId: number) {
    const escuela = await this.prisma.escuela.findUnique({
      where: { id: escuelaId },
      select: { id: true },
    });

    if (!escuela) {
      throw new NotFoundException(`Escuela con ID ${escuelaId} no encontrada.`);
    }
  }

  private validarRangoFechas(fechaInicioStr: string, fechaFinStr: string) {
    const inicio = new Date(fechaInicioStr);
    const fin = new Date(fechaFinStr);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new BadRequestException('Las fechas proporcionadas no son válidas.');
    }

    if (inicio >= fin) {
      throw new BadRequestException(
        'La fecha de inicio debe ser estrictamente anterior a la fecha de fin.',
      );
    }
  }
}