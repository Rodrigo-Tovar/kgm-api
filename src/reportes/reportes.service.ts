import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReporteCalificacionesQueryDto } from './dto/reporte-calificaciones-query.dto';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerOpciones(escuelaId: number) {
    const [ciclos, grados, grupos, materias, periodosRaw] = await Promise.all([
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
        select: { id: true, nombre: true, gradoId: true },
      }),
      this.prisma.materia.findMany({
        where: { escuelaId },
        orderBy: [{ gradoId: 'asc' }, { nombre: 'asc' }],
        select: { id: true, nombre: true, gradoId: true },
      }),
      this.prisma.calificacion.findMany({
        where: { escuelaId },
        distinct: ['periodo'],
        orderBy: { periodo: 'asc' },
        select: { periodo: true },
      }),
    ]);

    return {
      ciclos,
      grados,
      grupos,
      materias,
      periodos: periodosRaw.map((item) => item.periodo),
    };
  }

  async generarReporte(query: ReporteCalificacionesQueryDto) {
    const escuelaId = query.escuelaId ?? 1;

    const grupo = await this.prisma.grupo.findFirst({
      where: {
        id: query.grupoId,
        gradoId: query.gradoId,
        escuelaId,
      },
      include: { grado: true },
    });

    if (!grupo) {
      throw new BadRequestException('El grupo no pertenece al grado seleccionado');
    }

    const ciclo = await this.prisma.cicloEscolar.findFirst({
      where: { id: query.cicloId, escuelaId },
    });

    if (!ciclo) {
      throw new BadRequestException('El ciclo escolar seleccionado no existe');
    }

    const asignaciones = await this.prisma.asignacionAcademica.findMany({
      where: {
        escuelaId,
        cicloId: query.cicloId,
        grupoId: query.grupoId,
        activo: true,
        ...(query.materiaId ? { materiaId: query.materiaId } : {}),
      },
      include: { materia: true },
      orderBy: { materia: { nombre: 'asc' } },
    });

    const materias = Array.from(
      new Map(
        asignaciones.map((asignacion) => [
          asignacion.materia.id,
          { id: asignacion.materia.id, nombre: asignacion.materia.nombre },
        ]),
      ).values(),
    );

    const inscripciones = await this.prisma.alumnoGrupo.findMany({
      where: {
        escuelaId,
        cicloId: query.cicloId,
        grupoId: query.grupoId,
        activo: true,
      },
      include: { alumno: true },
      orderBy: [
        { alumno: { apellidoPaterno: 'asc' } },
        { alumno: { apellidoMaterno: 'asc' } },
        { alumno: { nombre: 'asc' } },
      ],
    });

    const alumnoIds = inscripciones.map((item) => item.alumnoId);
    const asignacionIds = asignaciones.map((item) => item.id);

    const calificaciones =
      alumnoIds.length > 0 && asignacionIds.length > 0
        ? await this.prisma.calificacion.findMany({
            where: {
              escuelaId,
              alumnoId: { in: alumnoIds },
              asignacionAcademicaId: { in: asignacionIds },
              periodo: query.periodo,
            },
            include: {
              asignacionAcademica: { include: { materia: true } },
            },
          })
        : [];

    const notasPorAlumno = new Map<number, Map<number, number>>();
    for (const calificacion of calificaciones) {
      const notas = notasPorAlumno.get(calificacion.alumnoId) ?? new Map<number, number>();
      notas.set(
        calificacion.asignacionAcademica.materiaId,
        Number(calificacion.valor.toString()),
      );
      notasPorAlumno.set(calificacion.alumnoId, notas);
    }

    const alumnos = inscripciones.map((inscripcion) => {
      const alumno = inscripcion.alumno;
      const notas = notasPorAlumno.get(alumno.id) ?? new Map<number, number>();
      const valores = materias
        .map((materia) => notas.get(materia.id))
        .filter((valor): valor is number => valor !== undefined);
      const promedio =
        valores.length > 0
          ? Number((valores.reduce((total, valor) => total + valor, 0) / valores.length).toFixed(1))
          : null;

      return {
        id: alumno.id,
        matricula: alumno.matricula,
        nombre: [alumno.nombre, alumno.apellidoPaterno, alumno.apellidoMaterno]
          .filter(Boolean)
          .join(' '),
        calificaciones: materias.map((materia) => ({
          materiaId: materia.id,
          materia: materia.nombre,
          valor: notas.get(materia.id) ?? null,
        })),
        promedio,
        estado: promedio === null ? 'SIN_CALIFICAR' : promedio >= 6 ? 'APROBADO' : 'EN_RIESGO',
      };
    });

    const promedios = alumnos
      .map((alumno) => alumno.promedio)
      .filter((promedio): promedio is number => promedio !== null);
    const promedioGeneral =
      promedios.length > 0
        ? Number((promedios.reduce((total, promedio) => total + promedio, 0) / promedios.length).toFixed(1))
        : null;
    const aprobados = alumnos.filter((alumno) => alumno.promedio !== null && alumno.promedio >= 6).length;
    const enRiesgo = alumnos.filter((alumno) => alumno.promedio !== null && alumno.promedio < 6).length;

    return {
      filtros: {
        cicloId: ciclo.id,
        cicloEscolar: ciclo.nombre,
        gradoId: grupo.gradoId,
        grado: grupo.grado.nombre,
        grupoId: grupo.id,
        grupo: grupo.nombre,
        materiaId: query.materiaId ?? null,
        periodo: query.periodo,
      },
      materias,
      resumen: {
        promedioGeneral,
        totalAlumnos: alumnos.length,
        totalMaterias: materias.length,
        aprobados,
        enRiesgo,
        sinCalificar: alumnos.filter((alumno) => alumno.promedio === null).length,
      },
      alumnos,
    };
  }
}
