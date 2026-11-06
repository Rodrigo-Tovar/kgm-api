import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearAsignacionAlumnoDto } from './dto/crear-asignacion-alumno.dto';
import { ActualizarAlumnoDto } from './dto/actualizar-alumno.dto';

@Injectable()
export class AlumnosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(escuelaId: number) {
    await this.validarEscuela(escuelaId);

    const alumnos = await this.prisma.alumno.findMany({
      where: { escuelaId },
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
      },
      orderBy: [
        { apellidoPaterno: 'asc' },
        { apellidoMaterno: 'asc' },
        { nombre: 'asc' },
      ],
    });

    return alumnos.map((alumno) => {
      const inscripcion = alumno.alumnogrupo[0] ?? null;

      return {
        id: alumno.id,
        escuelaId: alumno.escuelaId,
        matricula: alumno.matricula,
        curp: alumno.curp,
        nombre: alumno.nombre,
        apellidoPaterno: alumno.apellidoPaterno,
        apellidoMaterno: alumno.apellidoMaterno,
        nombreCompleto: [
          alumno.nombre,
          alumno.apellidoPaterno,
          alumno.apellidoMaterno,
        ].filter(Boolean).join(' '),
        grado: inscripcion?.grupo.grado.nombre ?? null,
        grupo: inscripcion?.grupo.nombre ?? null,
        cicloEscolar: inscripcion?.ciclo.nombre ?? null,
        turno: inscripcion?.turno ?? null,
        estado: inscripcion ? 'Activo' : 'Sin asignación',
      };
    });
  }
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

  async listarAsignaciones(escuelaId: number) {
    await this.validarEscuela(escuelaId);
    const alumnos = await this.prisma.alumno.findMany({
      where: { escuelaId },
      include: {
        alumnogrupo: {
          orderBy: { createdAt: 'desc' },
          include: {
            grupo: { include: { grado: true } },
            ciclo: true,
          },
        },
      },
      orderBy: [
        { apellidoPaterno: 'asc' },
        { apellidoMaterno: 'asc' },
        { nombre: 'asc' },
      ],
    });

    return alumnos.map((alumno) => {
      const asignaciones = [...alumno.alumnogrupo].sort(
        (a, b) => b.ciclo.fechaInicio.getTime() - a.ciclo.fechaInicio.getTime(),
      );

      return {
        id: alumno.id,
        nombre: [alumno.nombre, alumno.apellidoPaterno, alumno.apellidoMaterno]
          .filter(Boolean)
          .join(' '),
        curp: alumno.curp,
        estado: asignaciones.some((asignacion) => asignacion.activo)
          ? 'Activo'
          : 'Sin asignaciÃ³n',
        asignaciones: asignaciones.map((asignacion) => ({
          cicloId: asignacion.cicloId,
          cicloEscolar:
            asignacion.ciclo.nombre ??
            `${asignacion.ciclo.fechaInicio.getUTCFullYear()}-${asignacion.ciclo.fechaFin.getUTCFullYear()}`,
          gradoId: asignacion.grupo.gradoId,
          grado: asignacion.grupo.grado.nombre,
          grupoId: asignacion.grupoId,
          grupo: asignacion.grupo.nombre,
          estado: asignacion.activo ? 'Activo' : 'Inactivo',
          observaciones: asignacion.observaciones ?? '',
        })),
      };
    });
  }

  async obtenerOpcionesAsignacion(escuelaId: number) {
    await this.validarEscuela(escuelaId);
    const [ciclos, grados, grupos] = await Promise.all([
      this.prisma.cicloEscolar.findMany({
        where: { escuelaId },
        orderBy: { fechaInicio: 'desc' },
        select: { id: true, nombre: true, fechaInicio: true, fechaFin: true },
      }),
      this.prisma.grado.findMany({
        where: { escuelaId },
        orderBy: { id: 'asc' },
        select: { id: true, nombre: true },
      }),
      this.prisma.grupo.findMany({
        where: { escuelaId },
        orderBy: [{ gradoId: 'asc' }, { nombre: 'asc' }],
        select: { id: true, gradoId: true, nombre: true },
      }),
    ]);

    return {
      ciclos: ciclos.map((ciclo) => ({
        id: ciclo.id,
        nombre:
          ciclo.nombre ??
          `${ciclo.fechaInicio.getUTCFullYear()}-${ciclo.fechaFin.getUTCFullYear()}`,
      })),
      grados,
      grupos,
    };
  }

  async crearAsignacion(
    alumnoId: number,
    escuelaId: number,
    dto: CrearAsignacionAlumnoDto,
  ) {
    await this.validarEscuela(escuelaId);

    const alumno = await this.prisma.alumno.findFirst({
      where: { id: alumnoId, escuelaId },
      select: { id: true },
    });
    if (!alumno) {
      throw new NotFoundException(
        `Alumno con id ${alumnoId} no encontrado en la escuela`,
      );
    }

    const ciclo = await this.prisma.cicloEscolar.findFirst({
      where: { id: dto.cicloId, escuelaId },
      select: { id: true },
    });
    if (!ciclo) {
      throw new NotFoundException(
        `Ciclo escolar con id ${dto.cicloId} no encontrado en la escuela`,
      );
    }

    const grado = await this.prisma.grado.findFirst({
      where: { id: dto.gradoId, escuelaId },
      select: { id: true },
    });
    if (!grado) {
      throw new NotFoundException(
        `Grado con id ${dto.gradoId} no encontrado en la escuela`,
      );
    }

    const grupo = await this.prisma.grupo.findFirst({
      where: { id: dto.grupoId, escuelaId, gradoId: dto.gradoId },
      include: { grado: { select: { escuelaId: true } } },
    });
    if (!grupo || grupo.grado.escuelaId !== escuelaId) {
      throw new NotFoundException(
        `Grupo con id ${dto.grupoId} no encontrado en la escuela`,
      );
    }

    const existente = await this.prisma.alumnoGrupo.findUnique({
      where: {
        alumnoId_cicloId: { alumnoId, cicloId: dto.cicloId },
      },
      include: {
        grupo: { include: { grado: true } },
      },
    });
    if (existente) {
      throw new ConflictException(
        existente.activo
          ? `El alumno ya estÃ¡ asignado a ${existente.grupo.grado.nombre} ${existente.grupo.nombre} en ese ciclo escolar.`
          : 'El alumno ya tiene un registro de asignaciÃ³n para ese ciclo escolar.',
      );
    }

    try {
      await this.prisma.alumnoGrupo.create({
        data: {
          escuelaId,
          alumnoId,
          cicloId: dto.cicloId,
          grupoId: dto.grupoId,
          activo: true,
          fechaIngreso: new Date(),
          observaciones: dto.observaciones?.trim() || null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El alumno ya tiene una asignaciÃ³n registrada para ese ciclo escolar.',
        );
      }
      throw error;
    }

    const alumnos = await this.listarAsignaciones(escuelaId);
    const alumnoActualizado = alumnos.find((item) => item.id === alumnoId);
    if (!alumnoActualizado) {
      throw new NotFoundException(
        `Alumno con id ${alumnoId} no encontrado despuÃ©s de asignarlo`,
      );
    }
    return alumnoActualizado;
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
            `El alumno con id ${id} no tiene una inscripciÃ³n activa`,
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

  private async validarEscuela(escuelaId: number) {
    const escuela = await this.prisma.escuela.findUnique({
      where: { id: escuelaId },
      select: { id: true },
    });
    if (!escuela) {
      throw new NotFoundException(
        `Escuela con id ${escuelaId} no encontrada`,
      );
    }
  }
}
