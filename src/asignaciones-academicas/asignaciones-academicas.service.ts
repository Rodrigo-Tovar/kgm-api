import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarAsignacionAcademicaDto } from './dto/actualizar-asignacion-academica.dto';
import { CrearAsignacionAcademicaDto } from './dto/crear-asignacion-academica.dto';
import { ListarAsignacionesAcademicasQueryDto } from './dto/listar-asignaciones-academicas-query.dto';

type AsignacionConRelaciones = Prisma.AsignacionAcademicaGetPayload<{
  include: {
    ciclo: true;
    grupo: { include: { grado: true } };
    materia: true;
    docente: true;
  };
}>;

type CicloConFechas = {
  nombre: string | null;
  fechaInicio: Date;
  fechaFin: Date;
};

@Injectable()
export class AsignacionesAcademicasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarAsignacionesAcademicasQueryDto) {
    await this.validarEscuela(query.escuelaId);

    const busqueda = query.busqueda?.trim();
    const asignaciones = await this.prisma.asignacionAcademica.findMany({
      where: {
        escuelaId: query.escuelaId,
        ...(query.cicloId ? { cicloId: query.cicloId } : {}),
        ...(query.grupoId ? { grupoId: query.grupoId } : {}),
        ...(query.gradoId ? { grupo: { gradoId: query.gradoId } } : {}),
        ...(query.materiaId ? { materiaId: query.materiaId } : {}),
        ...(query.docenteId ? { docenteId: query.docenteId } : {}),
        ...(query.activo !== undefined ? { activo: query.activo } : {}),
        ...(busqueda
          ? {
              OR: [
                {
                  docente: {
                    nombre: { contains: busqueda, mode: 'insensitive' },
                  },
                },
                {
                  docente: {
                    apellidoPaterno: {
                      contains: busqueda,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  docente: {
                    apellidoMaterno: {
                      contains: busqueda,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  docente: {
                    curp: { contains: busqueda, mode: 'insensitive' },
                  },
                },
                {
                  materia: {
                    nombre: { contains: busqueda, mode: 'insensitive' },
                  },
                },
                {
                  grupo: {
                    nombre: { contains: busqueda, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: this.incluirRelaciones(),
      orderBy: [
        { ciclo: { fechaInicio: 'desc' } },
        { grupo: { gradoId: 'asc' } },
        { grupo: { nombre: 'asc' } },
        { materia: { nombre: 'asc' } },
      ],
    });

    return asignaciones.map((asignacion) => this.mapearAsignacion(asignacion));
  }

  async obtenerOpciones(escuelaId: number) {
    await this.validarEscuela(escuelaId);

    const [ciclos, grados, grupos, materias, docentes] = await Promise.all([
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
      this.prisma.materia.findMany({
        where: { escuelaId },
        orderBy: [{ gradoId: 'asc' }, { nombre: 'asc' }],
        select: { id: true, gradoId: true, clave: true, nombre: true },
      }),
      this.prisma.docente.findMany({
        where: { escuelaId, estado: 'ACTIVO' },
        orderBy: [{ apellidoPaterno: 'asc' }, { nombre: 'asc' }],
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          curp: true,
          fotoUrl: true,
        },
      }),
    ]);

    return {
      ciclos: ciclos.map((ciclo) => ({
        id: ciclo.id,
        nombre: this.nombreCiclo(ciclo),
      })),
      grados,
      grupos,
      materias,
      docentes: docentes.map((docente) => ({
        id: docente.id,
        nombreCompleto: [
          docente.nombre,
          docente.apellidoPaterno,
          docente.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(' '),
        curp: docente.curp,
        foto: docente.fotoUrl,
      })),
    };
  }

  async obtenerPorId(id: number, escuelaId: number) {
    await this.validarEscuela(escuelaId);

    const asignacion = await this.prisma.asignacionAcademica.findFirst({
      where: { id, escuelaId },
      include: this.incluirRelaciones(),
    });

    if (!asignacion) {
      throw new NotFoundException(
        `Asignación académica con id ${id} no encontrada`,
      );
    }

    return this.mapearAsignacion(asignacion);
  }

  async crear(dto: CrearAsignacionAcademicaDto) {
    await this.validarEscuela(dto.escuelaId);

    const grupo = await this.validarCicloGrupoMateriaDocente(
      dto.escuelaId,
      dto.cicloId,
      dto.grupoId,
      dto.materiaId,
      dto.docenteId,
    );

    this.validarCoherenciaGrado(grupo.gradoId, grupo.materiaGradoId);
    await this.validarDuplicado(
      dto.escuelaId,
      dto.cicloId,
      dto.grupoId,
      dto.materiaId,
    );

    try {
      await this.prisma.asignacionAcademica.create({
        data: {
          escuelaId: dto.escuelaId,
          cicloId: dto.cicloId,
          grupoId: dto.grupoId,
          materiaId: dto.materiaId,
          docenteId: dto.docenteId,
          activo: dto.activo ?? true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una asignación para esa materia y grupo en el ciclo seleccionado.',
        );
      }
      throw error;
    }

    return this.obtenerAsignacionCreada(
      dto.escuelaId,
      dto.cicloId,
      dto.grupoId,
      dto.materiaId,
    );
  }

  async actualizar(
    id: number,
    escuelaId: number,
    dto: ActualizarAsignacionAcademicaDto,
  ) {
    await this.validarEscuela(escuelaId);

    const actual = await this.prisma.asignacionAcademica.findFirst({
      where: { id, escuelaId },
      select: {
        id: true,
        cicloId: true,
        grupoId: true,
        materiaId: true,
        docenteId: true,
        activo: true,
      },
    });

    if (!actual) {
      throw new NotFoundException(
        `Asignación académica con id ${id} no encontrada`,
      );
    }

    const cicloId = dto.cicloId ?? actual.cicloId;
    const grupoId = dto.grupoId ?? actual.grupoId;
    const materiaId = dto.materiaId ?? actual.materiaId;
    const docenteId = dto.docenteId ?? actual.docenteId;

    const grupo = await this.validarCicloGrupoMateriaDocente(
      escuelaId,
      cicloId,
      grupoId,
      materiaId,
      docenteId,
    );

    this.validarCoherenciaGrado(grupo.gradoId, grupo.materiaGradoId);
    await this.validarDuplicado(escuelaId, cicloId, grupoId, materiaId, id);

    await this.prisma.asignacionAcademica.update({
      where: { id },
      data: {
        ...(dto.cicloId !== undefined ? { cicloId } : {}),
        ...(dto.grupoId !== undefined ? { grupoId } : {}),
        ...(dto.materiaId !== undefined ? { materiaId } : {}),
        ...(dto.docenteId !== undefined ? { docenteId } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
    });

    return this.obtenerPorId(id, escuelaId);
  }

  async eliminar(id: number, escuelaId: number) {
    await this.validarEscuela(escuelaId);

    const asignacion = await this.prisma.asignacionAcademica.findFirst({
      where: { id, escuelaId },
      select: { id: true },
    });

    if (!asignacion) {
      throw new NotFoundException(
        `Asignación académica con id ${id} no encontrada`,
      );
    }

    const calificaciones = await this.prisma.calificacion.count({
      where: { asignacionAcademicaId: id },
    });

    if (calificaciones > 0) {
      throw new ConflictException(
        'No se puede eliminar la asignación académica porque tiene calificaciones asociadas.',
      );
    }

    await this.prisma.asignacionAcademica.delete({ where: { id } });

    return { id, mensaje: 'Asignación académica eliminada correctamente' };
  }

  private async obtenerAsignacionCreada(
    escuelaId: number,
    cicloId: number,
    grupoId: number,
    materiaId: number,
  ) {
    const asignacion = await this.prisma.asignacionAcademica.findFirst({
      where: { escuelaId, cicloId, grupoId, materiaId },
      include: this.incluirRelaciones(),
    });

    if (!asignacion) {
      throw new NotFoundException(
        'Asignación académica no encontrada después de crearla',
      );
    }

    return this.mapearAsignacion(asignacion);
  }

  private async validarCicloGrupoMateriaDocente(
    escuelaId: number,
    cicloId: number,
    grupoId: number,
    materiaId: number,
    docenteId: number,
  ) {
    const [ciclo, grupo, materia, docente] = await Promise.all([
      this.prisma.cicloEscolar.findFirst({
        where: { id: cicloId, escuelaId },
        select: { id: true },
      }),
      this.prisma.grupo.findFirst({
        where: { id: grupoId, escuelaId },
        select: { id: true, gradoId: true },
      }),
      this.prisma.materia.findFirst({
        where: { id: materiaId, escuelaId },
        select: { id: true, gradoId: true },
      }),
      this.prisma.docente.findFirst({
        where: { id: docenteId, escuelaId },
        select: { id: true, estado: true },
      }),
    ]);

    if (!ciclo) {
      throw new NotFoundException(
        `Ciclo escolar con id ${cicloId} no encontrado en la escuela`,
      );
    }
    if (!grupo) {
      throw new NotFoundException(
        `Grupo con id ${grupoId} no encontrado en la escuela`,
      );
    }
    if (!materia) {
      throw new NotFoundException(
        `Materia con id ${materiaId} no encontrada en la escuela`,
      );
    }
    if (!docente) {
      throw new NotFoundException(
        `Docente con id ${docenteId} no encontrado en la escuela`,
      );
    }
    if (docente.estado === 'INACTIVO') {
      throw new BadRequestException('El docente seleccionado no está activo.');
    }

    return {
      gradoId: grupo.gradoId,
      materiaGradoId: materia.gradoId,
    };
  }

  private validarCoherenciaGrado(grupoGradoId: number, materiaGradoId: number) {
    if (grupoGradoId !== materiaGradoId) {
      throw new BadRequestException(
        'La materia no corresponde al grado del grupo seleccionado.',
      );
    }
  }

  private async validarDuplicado(
    escuelaId: number,
    cicloId: number,
    grupoId: number,
    materiaId: number,
    excluirId?: number,
  ) {
    const duplicado = await this.prisma.asignacionAcademica.findFirst({
      where: {
        escuelaId,
        cicloId,
        grupoId,
        materiaId,
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
      select: { id: true },
    });

    if (duplicado) {
      throw new ConflictException(
        'Ya existe una asignación para esa materia y grupo en el ciclo seleccionado.',
      );
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

  private incluirRelaciones() {
    return {
      ciclo: true,
      grupo: { include: { grado: true } },
      materia: true,
      docente: true,
    } as const;
  }

  private nombreCiclo(ciclo: CicloConFechas) {
    return (
      ciclo.nombre ??
      `${ciclo.fechaInicio.getUTCFullYear()}-${ciclo.fechaFin.getUTCFullYear()}`
    );
  }

  private mapearAsignacion(asignacion: AsignacionConRelaciones) {
    return {
      id: asignacion.id,
      escuelaId: asignacion.escuelaId,
      cicloId: asignacion.cicloId,
      cicloEscolar: this.nombreCiclo(asignacion.ciclo),
      grupoId: asignacion.grupoId,
      grupo: asignacion.grupo.nombre,
      gradoId: asignacion.grupo.gradoId,
      grado: asignacion.grupo.grado.nombre,
      materiaId: asignacion.materiaId,
      materia: asignacion.materia.nombre,
      claveMateria: asignacion.materia.clave,
      docenteId: asignacion.docenteId,
      docente: [
        asignacion.docente.nombre,
        asignacion.docente.apellidoPaterno,
        asignacion.docente.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(' '),
      docenteCurp: asignacion.docente.curp,
      docenteFoto: asignacion.docente.fotoUrl,
      activo: asignacion.activo ?? false,
      createdAt: asignacion.createdAt?.toISOString() ?? null,
    };
  }
}
