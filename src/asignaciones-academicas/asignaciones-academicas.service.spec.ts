import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AsignacionesAcademicasService } from './asignaciones-academicas.service';

describe('AsignacionesAcademicasService', () => {
  let service: AsignacionesAcademicasService;
  let prisma: any;

  const cicloBase = {
    id: 2,
    nombre: '2026-2027',
    fechaInicio: new Date('2026-08-01T00:00:00.000Z'),
    fechaFin: new Date('2027-06-30T00:00:00.000Z'),
  };

  const asignacionBase = {
    id: 10,
    escuelaId: 1,
    cicloId: 2,
    grupoId: 3,
    materiaId: 4,
    docenteId: 5,
    activo: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ciclo: cicloBase,
    grupo: { id: 3, gradoId: 6, nombre: 'A', grado: { id: 6, nombre: '1ro' } },
    materia: { id: 4, gradoId: 6, clave: 'MAT-001', nombre: 'Matemáticas' },
    docente: {
      id: 5,
      nombre: 'Ana',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
    },
  };

  const asignacionMapeada = {
    id: 10,
    escuelaId: 1,
    cicloId: 2,
    cicloEscolar: '2026-2027',
    grupoId: 3,
    grupo: 'A',
    gradoId: 6,
    grado: '1ro',
    materiaId: 4,
    materia: 'Matemáticas',
    claveMateria: 'MAT-001',
    docenteId: 5,
    docente: 'Ana Pérez López',
    activo: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function prepararReferencias({
    gradoGrupo = 6,
    gradoMateria = 6,
    estadoDocente = 'ACTIVO',
  } = {}) {
    prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
    prisma.cicloEscolar.findFirst.mockResolvedValue({ id: 2 });
    prisma.grupo.findFirst.mockResolvedValue({ id: 3, gradoId: gradoGrupo });
    prisma.materia.findFirst.mockResolvedValue({
      id: 4,
      gradoId: gradoMateria,
    });
    prisma.docente.findFirst.mockResolvedValue({
      id: 5,
      estado: estadoDocente,
    });
  }

  beforeEach(() => {
    prisma = {
      escuela: { findUnique: jest.fn() },
      cicloEscolar: { findFirst: jest.fn(), findMany: jest.fn() },
      grado: { findMany: jest.fn() },
      grupo: { findFirst: jest.fn(), findMany: jest.fn() },
      materia: { findFirst: jest.fn(), findMany: jest.fn() },
      docente: { findFirst: jest.fn(), findMany: jest.fn() },
      asignacionAcademica: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      calificacion: { count: jest.fn() },
    };

    service = new AsignacionesAcademicasService(prisma as PrismaService);
  });

  describe('listar', () => {
    it('consulta las asignaciones de la escuela y las mapea', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.asignacionAcademica.findMany.mockResolvedValue([asignacionBase]);

      const resultado = await service.listar({ escuelaId: 1 });

      expect(prisma.asignacionAcademica.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { escuelaId: 1 },
        }),
      );
      expect(resultado).toEqual([asignacionMapeada]);
    });

    it('aplica los filtros recibidos y la búsqueda', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.asignacionAcademica.findMany.mockResolvedValue([]);

      await service.listar({
        escuelaId: 1,
        cicloId: 2,
        grupoId: 3,
        materiaId: 4,
        docenteId: 5,
        activo: true,
        busqueda: ' mate ',
      });

      const argumento = prisma.asignacionAcademica.findMany.mock.calls[0][0];
      expect(argumento.where).toEqual(
        expect.objectContaining({
          escuelaId: 1,
          cicloId: 2,
          grupoId: 3,
          materiaId: 4,
          docenteId: 5,
          activo: true,
        }),
      );
      expect(argumento.where.OR).toEqual(
        expect.arrayContaining([
          { materia: { nombre: { contains: 'mate', mode: 'insensitive' } } },
        ]),
      );
    });

    it('rechaza una escuela inexistente', async () => {
      prisma.escuela.findUnique.mockResolvedValue(null);

      await expect(service.listar({ escuelaId: 99 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('obtenerOpciones', () => {
    it('devuelve ciclos, grados, grupos, materias y docentes activos', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.cicloEscolar.findMany.mockResolvedValue([
        {
          id: 2,
          nombre: null,
          fechaInicio: new Date('2026-08-01T00:00:00.000Z'),
          fechaFin: new Date('2027-06-30T00:00:00.000Z'),
        },
      ]);
      prisma.grado.findMany.mockResolvedValue([{ id: 6, nombre: '1ro' }]);
      prisma.grupo.findMany.mockResolvedValue([
        { id: 3, gradoId: 6, nombre: 'A' },
      ]);
      prisma.materia.findMany.mockResolvedValue([
        { id: 4, gradoId: 6, clave: 'MAT-001', nombre: 'Matemáticas' },
      ]);
      prisma.docente.findMany.mockResolvedValue([
        {
          id: 5,
          nombre: 'Ana',
          apellidoPaterno: 'Pérez',
          apellidoMaterno: 'López',
          curp: 'PELA900101MDFRNN01',
        },
      ]);

      const resultado = await service.obtenerOpciones(1);

      expect(prisma.docente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { escuelaId: 1, estado: 'ACTIVO' } }),
      );
      expect(resultado).toEqual({
        ciclos: [{ id: 2, nombre: '2026-2027' }],
        grados: [{ id: 6, nombre: '1ro' }],
        grupos: [{ id: 3, gradoId: 6, nombre: 'A' }],
        materias: [
          { id: 4, gradoId: 6, clave: 'MAT-001', nombre: 'Matemáticas' },
        ],
        docentes: [
          {
            id: 5,
            nombreCompleto: 'Ana Pérez López',
            curp: 'PELA900101MDFRNN01',
          },
        ],
      });
    });
  });

  describe('obtenerPorId', () => {
    it('devuelve la asignación mapeada', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.asignacionAcademica.findFirst.mockResolvedValue(asignacionBase);

      const resultado = await service.obtenerPorId(10, 1);

      expect(resultado).toEqual(asignacionMapeada);
    });

    it('rechaza una asignación inexistente', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.asignacionAcademica.findFirst.mockResolvedValue(null);

      await expect(service.obtenerPorId(10, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('crear', () => {
    it('crea la asignación y devuelve el contrato mapeado', async () => {
      prepararReferencias();
      prisma.asignacionAcademica.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(asignacionBase);
      prisma.asignacionAcademica.create.mockResolvedValue(asignacionBase);

      const resultado = await service.crear({
        escuelaId: 1,
        cicloId: 2,
        grupoId: 3,
        materiaId: 4,
        docenteId: 5,
      });

      expect(prisma.asignacionAcademica.create).toHaveBeenCalledWith({
        data: {
          escuelaId: 1,
          cicloId: 2,
          grupoId: 3,
          materiaId: 4,
          docenteId: 5,
          activo: true,
        },
      });
      expect(resultado).toEqual(asignacionMapeada);
    });

    it('rechaza un ciclo que no pertenece a la escuela', async () => {
      prepararReferencias();
      prisma.cicloEscolar.findFirst.mockResolvedValue(null);

      await expect(
        service.crear({
          escuelaId: 1,
          cicloId: 2,
          grupoId: 3,
          materiaId: 4,
          docenteId: 5,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza un docente inactivo', async () => {
      prepararReferencias({ estadoDocente: 'INACTIVO' });

      await expect(
        service.crear({
          escuelaId: 1,
          cicloId: 2,
          grupoId: 3,
          materiaId: 4,
          docenteId: 5,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza una materia de otro grado', async () => {
      prepararReferencias({ gradoGrupo: 6, gradoMateria: 7 });

      await expect(
        service.crear({
          escuelaId: 1,
          cicloId: 2,
          grupoId: 3,
          materiaId: 4,
          docenteId: 5,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza una asignación duplicada', async () => {
      prepararReferencias();
      prisma.asignacionAcademica.findFirst.mockResolvedValue({ id: 99 });

      await expect(
        service.crear({
          escuelaId: 1,
          cicloId: 2,
          grupoId: 3,
          materiaId: 4,
          docenteId: 5,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.asignacionAcademica.create).not.toHaveBeenCalled();
    });
  });

  describe('actualizar', () => {
    it('actualiza el docente y revalida las referencias', async () => {
      prepararReferencias();
      prisma.asignacionAcademica.findFirst
        .mockResolvedValueOnce({
          id: 10,
          cicloId: 2,
          grupoId: 3,
          materiaId: 4,
          docenteId: 5,
          activo: true,
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(asignacionBase);
      prisma.asignacionAcademica.update.mockResolvedValue(asignacionBase);

      const resultado = await service.actualizar(10, 1, { docenteId: 5 });

      expect(prisma.asignacionAcademica.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { docenteId: 5 },
      });
      expect(resultado).toEqual(asignacionMapeada);
    });

    it('rechaza el cambio a una combinación duplicada', async () => {
      prepararReferencias();
      prisma.asignacionAcademica.findFirst
        .mockResolvedValueOnce({
          id: 10,
          cicloId: 2,
          grupoId: 3,
          materiaId: 4,
          docenteId: 5,
          activo: true,
        })
        .mockResolvedValueOnce({ id: 99 });

      await expect(
        service.actualizar(10, 1, { docenteId: 5 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.asignacionAcademica.update).not.toHaveBeenCalled();
    });

    it('rechaza una asignación inexistente', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.asignacionAcademica.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(10, 1, { docenteId: 5 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('eliminar', () => {
    it('elimina cuando no tiene calificaciones', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.asignacionAcademica.findFirst.mockResolvedValue({ id: 10 });
      prisma.calificacion.count.mockResolvedValue(0);
      prisma.asignacionAcademica.delete.mockResolvedValue(asignacionBase);

      const resultado = await service.eliminar(10, 1);

      expect(prisma.asignacionAcademica.delete).toHaveBeenCalledWith({
        where: { id: 10 },
      });
      expect(resultado).toEqual({
        id: 10,
        mensaje: 'Asignación académica eliminada correctamente',
      });
    });

    it('rechaza eliminar cuando tiene calificaciones', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.asignacionAcademica.findFirst.mockResolvedValue({ id: 10 });
      prisma.calificacion.count.mockResolvedValue(2);

      await expect(service.eliminar(10, 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.asignacionAcademica.delete).not.toHaveBeenCalled();
    });

    it('rechaza una asignación inexistente', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.asignacionAcademica.findFirst.mockResolvedValue(null);

      await expect(service.eliminar(10, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
