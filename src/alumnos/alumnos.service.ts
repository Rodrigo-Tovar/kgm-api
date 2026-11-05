import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarAlumnoDto } from './dto/actualizar-alumno.dto';

@Injectable()
export class AlumnosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPorId(id: number) {
    const alumno = await this.prisma.alumno.findUnique({
      where: { id },
      include: {
        alumnogrupo: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            grupo: { include: { grado: true } },
            ciclo: true,
          },
        },
        alumnotutor: {
          where: { esPrincipal: true },
          take: 1,
          include: { tutor: true },
        },
        expedienteacademico: true,
      },
    });

    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }

    const inscripcion = alumno.alumnogrupo[0] ?? null;
    const tutorPrincipal = alumno.alumnotutor[0]?.tutor ?? null;

    return {
      id: alumno.id,
      escuelaId: alumno.escuelaId,
      matricula: alumno.matricula,
      curp: alumno.curp,
      nombre: alumno.nombre,
      apellidoPaterno: alumno.apellidoPaterno,
      apellidoMaterno: alumno.apellidoMaterno,
      fechaNacimiento: alumno.fechaNacimiento,
      nacionalidad: alumno.nacionalidad,
      genero: alumno.genero,
      direccion: alumno.direccion,
      telefono: alumno.telefono,
      correo: alumno.correo,
      datosEscolares: inscripcion
        ? {
            alumnoGrupoId: inscripcion.id,
            grado: inscripcion.grupo.grado.nombre,
            gradoId: inscripcion.grupo.gradoId,
            grupo: inscripcion.grupo.nombre,
            grupoId: inscripcion.grupoId,
            cicloEscolar: inscripcion.ciclo.nombre,
            cicloId: inscripcion.cicloId,
            activo: inscripcion.activo,
            turno: inscripcion.turno,
            fechaIngreso: inscripcion.fechaIngreso,
            observaciones: inscripcion.observaciones,
          }
        : null,
      tutorPrincipal,
      expedienteAcademico: alumno.expedienteacademico,
    };
  }

  async actualizar(id: number, dto: ActualizarAlumnoDto) {
    const existe = await this.prisma.alumno.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existe) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }

    const {
      turno,
      fechaIngreso,
      observaciones,
      fechaNacimiento,
      ...datosAlumno
    } = dto;

    await this.prisma.$transaction(async (tx) => {
      await tx.alumno.update({
        where: { id },
        data: {
          ...datosAlumno,
          ...(fechaNacimiento
            ? { fechaNacimiento: new Date(fechaNacimiento) }
            : {}),
        },
      });

      const actualizaInscripcion =
        turno !== undefined ||
        fechaIngreso !== undefined ||
        observaciones !== undefined;

      if (actualizaInscripcion) {
        const inscripcion = await tx.alumnoGrupo.findFirst({
          where: { alumnoId: id, activo: true },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });

        if (!inscripcion) {
          throw new NotFoundException(
            `El alumno con id ${id} no tiene una inscripción activa`,
          );
        }

        await tx.alumnoGrupo.update({
          where: { id: inscripcion.id },
          data: {
            ...(turno !== undefined ? { turno } : {}),
            ...(fechaIngreso !== undefined
              ? { fechaIngreso: new Date(fechaIngreso) }
              : {}),
            ...(observaciones !== undefined ? { observaciones } : {}),
          },
        });
      }
    });

    return this.obtenerPorId(id);
  }
}
