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
  constructor(private readonly prisma: PrismaService) { }

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

  // Crear ciclo escolar: forzado a 'Programado' y blindado contra solapamientos
  async crear(escuelaId: number, dto: CrearCicloEscolarDto) {
    await this.validarEscuela(escuelaId);

    const inicio = new Date(dto.fechaInicio);
    const fin = new Date(dto.fechaFin);

    this.validarRangoFechas(inicio, fin);

    // 1. Validar duplicado por nombre
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

    // 2. Validar solapamiento (Overlap) de fechas con ciclos existentes
    // Condición matemática de intersección de rangos: (InicioA <= FinB) Y (FinA >= InicioB)
    const cicloSolapado = await this.prisma.cicloEscolar.findFirst({
      where: {
        escuelaId,
        AND: [
          { fechaInicio: { lte: fin } },
          { fechaFin: { gte: inicio } },
        ],
      },
    });

    if (cicloSolapado) {
      throw new ConflictException(
        `Las fechas seleccionadas (${dto.fechaInicio} a ${dto.fechaFin}) se traslapan con el ciclo escolar existente "${cicloSolapado.nombre}".`,
      );
    }

    // 3. Todo ciclo nuevo se crea por defecto como 'Programado'
    return this.prisma.cicloEscolar.create({
      data: {
        escuelaId,
        nombre: dto.nombre.trim(),
        fechaInicio: inicio,
        fechaFin: fin,
        estado: 'Programado',
      },
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

  private validarRangoFechas(inicio: Date, fin: Date) {
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new BadRequestException('Las fechas proporcionadas no son válidas.');
    }

    // 1. Evitar crear ciclos cuya fecha de fin ya haya pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizamos a medianoche para comparar solo fechas de calendario

    if (fin < hoy) {
      throw new BadRequestException(
        'No se puede registrar un ciclo escolar cuya fecha de finalización sea anterior a la fecha actual.',
      );
    }

    // 2. La fecha de inicio debe ser estrictamente anterior a la fecha de fin
    if (inicio >= fin) {
      throw new BadRequestException(
        'La fecha de inicio debe ser estrictamente anterior a la fecha de fin.',
      );
    }

    // 3. Duración mínima razonable de 30 días
    const diasDiferencia = (fin.getTime() - inicio.getTime()) / (1000 * 3600 * 24);
    if (diasDiferencia < 30) {
      throw new BadRequestException(
        'Un ciclo escolar debe durar al menos 30 días.',
      );
    }
  }

  async cambiarEstado(
    escuelaId: number,
    cicloId: number,
    nuevoEstado: 'Activo' | 'Cerrado' | 'Programado',
  ) {
    await this.validarEscuela(escuelaId);

    const ciclo = await this.prisma.cicloEscolar.findFirst({
      where: { id: cicloId, escuelaId },
    });

    if (!ciclo) {
      throw new NotFoundException(
        `Ciclo escolar con ID ${cicloId} no encontrado en esta escuela.`,
      );
    }

    // 🛡️ REGLA DE ORO: Un ciclo "Cerrado" no se puede reabrir ni modificar bajo ninguna circunstancia
    if (ciclo.estado === 'Cerrado') {
      throw new BadRequestException(
        'No es posible cambiar el estado de un ciclo escolar que ya ha sido cerrado.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Si pasa a 'Activo', mandamos a 'Cerrado' cualquier otro activo previo de la escuela
      if (nuevoEstado === 'Activo') {
        await tx.cicloEscolar.updateMany({
          where: {
            escuelaId,
            estado: 'Activo',
            id: { not: cicloId },
          },
          data: { estado: 'Cerrado' },
        });
      }

      return tx.cicloEscolar.update({
        where: { id: cicloId },
        data: { estado: nuevoEstado },
      });
    });
  }

  async listarPaginado(
  escuelaId: number,
  pagina: number = 1,
  limite: number = 10,
  estado?: string,
) {
  await this.validarEscuela(escuelaId);

  const skip = (pagina - 1) * limite;
  const whereCondition = {
    escuelaId,
    ...(estado && estado !== 'Todos' ? { estado } : {}),
  };

  const [total, datos] = await Promise.all([
    this.prisma.cicloEscolar.count({ where: whereCondition }),
    this.prisma.cicloEscolar.findMany({
      where: whereCondition,
      orderBy: { fechaInicio: 'desc' },
      skip,
      take: limite,
    }),
  ]);

  const totalPaginas = Math.ceil(total / limite);

  return {
    datos,
    meta: {
      total,
      pagina,
      limite,
      totalPaginas,
      tienePaginaSiguiente: pagina < totalPaginas,
      tienePaginaAnterior: pagina > 1,
    },
  };
}
}

