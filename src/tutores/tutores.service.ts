import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearTutorDto } from './dto/crear-tutor.dto';

@Injectable()
export class TutoresService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(escuelaId: number, search?: string) {
    await this.validarEscuela(escuelaId);
    const termino = search?.trim();
    const tutores = await this.prisma.tutor.findMany({
      where: {
        escuelaId,
        ...(termino
          ? {
              OR: [
                { nombre: { contains: termino, mode: 'insensitive' } },
                { apellidoPaterno: { contains: termino, mode: 'insensitive' } },
                { curp: { contains: termino, mode: 'insensitive' } },
                { correo: { contains: termino, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { alumnotutor: { include: { alumno: true } } },
      orderBy: [{ apellidoPaterno: 'asc' }, { nombre: 'asc' }],
    });

    return tutores.map((tutor) => this.mapearTutor(tutor));
  }

  async obtenerPorId(id: number, escuelaId: number) {
    await this.validarEscuela(escuelaId);
    const tutor = await this.prisma.tutor.findFirst({
      where: { id, escuelaId },
      include: { alumnotutor: { include: { alumno: true } } },
    });

    if (!tutor) {
      throw new NotFoundException(`Tutor con id ${id} no encontrado`);
    }

    return this.mapearTutor(tutor);
  }

  async crear(dto: CrearTutorDto) {
    const curp = dto.curp.trim().toUpperCase();
    const correo = dto.email.trim().toLowerCase();
    await this.validarEscuela(dto.escuelaId);

    const existente = await this.prisma.tutor.findFirst({
      where: {
        escuelaId: dto.escuelaId,
        OR: [{ curp }, { correo }],
      },
      select: { curp: true, correo: true },
    });

    if (existente?.curp === curp) {
      throw new ConflictException(
        'Ya existe un tutor registrado con este CURP en la institución.',
      );
    }
    if (existente?.correo?.toLowerCase() === correo) {
      throw new ConflictException(
        'Ya existe un tutor registrado con este correo electrónico en la institución.',
      );
    }

    try {
      const tutor = await this.prisma.tutor.create({
        data: {
          escuelaId: dto.escuelaId,
          nombre: dto.nombre.trim(),
          apellidoPaterno: dto.apellidoPaterno.trim(),
          apellidoMaterno: dto.apellidoMaterno?.trim() || null,
          curp,
          parentesco: dto.parentesco?.trim() || null,
          correo,
          telefono: dto.telefono.trim(),
          direccion: dto.direccion?.trim() || null,
        },
        include: { alumnotutor: true },
      });

      return this.mapearTutor(tutor);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
        if (target.includes('curp')) {
          throw new ConflictException(
            'Ya existe un tutor registrado con este CURP en la institución.',
          );
        }
        throw new ConflictException(
          'Ya existe un tutor registrado con este correo electrónico en la institución.',
        );
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

  private mapearTutor(tutor: any) {
    return {
      id: tutor.id,
      escuelaId: tutor.escuelaId,
      nombre: tutor.nombre,
      apellidoPaterno: tutor.apellidoPaterno,
      apellidoMaterno: tutor.apellidoMaterno,
      curp: tutor.curp,
      telefono: tutor.telefono,
      email: tutor.correo,
      correo: tutor.correo,
      parentesco: tutor.parentesco,
      direccion: tutor.direccion,
      alumnos: tutor.alumnotutor?.map((relacion: any) => relacion.alumno) ?? [],
      createdAt: tutor.createdAt,
    };
  }
}
