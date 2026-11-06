import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MateriasService } from './materias.service';

describe('MateriasService', () => {
  let service: MateriasService;
  let prisma: any;

  const materiaBase = {
    id: 5,
    escuelaId: 1,
    gradoId: 2,
    clave: 'ESP-001',
    nombre: 'Español',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    grado: { id: 2, nombre: '1ro' },
  };

  beforeEach(() => {
    prisma = {
      escuela: { findUnique: jest.fn() },
      grado: { findFirst: jest.fn(), findMany: jest.fn() },
      materia: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      asignacionAcademica: { count: jest.fn() },
    };

    service = new MateriasService(prisma as PrismaService);
  });

  describe('listar', () => {
    it('consulta las materias de la escuela y las mapea', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findMany.mockResolvedValue([materiaBase]);

      const resultado = await service.listar({ escuelaId: 1 });

      expect(prisma.materia.findMany).toHaveBeenCalledWith({
        where: { escuelaId: 1 },
        include: { grado: true },
        orderBy: [{ grado: { nombre: 'asc' } }, { nombre: 'asc' }],
      });
      expect(resultado).toEqual([
        {
          id: 5,
          escuelaId: 1,
          gradoId: 2,
          grado: '1ro',
          clave: 'ESP-001',
          nombre: 'Español',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('filtra por grado y búsqueda cuando se reciben', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findMany.mockResolvedValue([]);

      await service.listar({ escuelaId: 1, gradoId: 2, busqueda: ' mate ' });

      expect(prisma.materia.findMany).toHaveBeenCalledWith({
        where: {
          escuelaId: 1,
          gradoId: 2,
          nombre: { contains: 'mate', mode: 'insensitive' },
        },
        include: { grado: true },
        orderBy: [{ grado: { nombre: 'asc' } }, { nombre: 'asc' }],
      });
    });

    it('rechaza una escuela inexistente', async () => {
      prisma.escuela.findUnique.mockResolvedValue(null);

      await expect(service.listar({ escuelaId: 99 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('obtenerOpciones', () => {
    it('devuelve los grados de la escuela', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.grado.findMany.mockResolvedValue([
        { id: 1, nombre: 'Primero' },
        { id: 2, nombre: 'Segundo' },
      ]);

      const resultado = await service.obtenerOpciones(1);

      expect(prisma.grado.findMany).toHaveBeenCalledWith({
        where: { escuelaId: 1 },
        orderBy: { id: 'asc' },
        select: { id: true, nombre: true },
      });
      expect(resultado).toEqual({
        grados: [
          { id: 1, nombre: 'Primero' },
          { id: 2, nombre: 'Segundo' },
        ],
      });
    });
  });

  describe('crear', () => {
    it('crea la materia cuando los datos son válidos', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.grado.findFirst.mockResolvedValue({ id: 2 });
      prisma.materia.findFirst.mockResolvedValue(null);
      prisma.materia.create.mockResolvedValue(materiaBase);

      const resultado = await service.crear({
        escuelaId: 1,
        gradoId: 2,
        clave: '  ESP-001  ',
        nombre: '  Español  ',
      });

      expect(prisma.materia.create).toHaveBeenCalledWith({
        data: {
          escuelaId: 1,
          gradoId: 2,
          clave: 'ESP-001',
          nombre: 'Español',
        },
        include: { grado: true },
      });
      expect(resultado.nombre).toBe('Español');
      expect(resultado.clave).toBe('ESP-001');
    });

    it('rechaza materias duplicadas en el mismo grado', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.grado.findFirst.mockResolvedValue({ id: 2 });
      prisma.materia.findFirst.mockResolvedValue({ id: 9 });

      await expect(
        service.crear({
          escuelaId: 1,
          gradoId: 2,
          clave: 'ESP-001',
          nombre: 'Español',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.materia.create).not.toHaveBeenCalled();
    });

    it('rechaza claves duplicadas en la escuela', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.grado.findFirst.mockResolvedValue({ id: 2 });
      prisma.materia.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 9 });

      await expect(
        service.crear({
          escuelaId: 1,
          gradoId: 2,
          clave: 'ESP-001',
          nombre: 'Español',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.materia.create).not.toHaveBeenCalled();
    });

    it('rechaza un grado que no pertenece a la escuela', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.grado.findFirst.mockResolvedValue(null);

      await expect(
        service.crear({
          escuelaId: 1,
          gradoId: 99,
          clave: 'ESP-001',
          nombre: 'Español',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.materia.create).not.toHaveBeenCalled();
    });
  });

  describe('actualizar', () => {
    it('actualiza el nombre y devuelve la materia actualizada', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findFirst
        .mockResolvedValueOnce({
          id: 5,
          gradoId: 2,
          clave: 'ESP-001',
          nombre: 'Español',
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...materiaBase,
          nombre: 'Lengua Española',
        });
      prisma.materia.update.mockResolvedValue({ id: 5 });

      const resultado = await service.actualizar(5, 1, {
        nombre: 'Lengua Española',
      });

      expect(prisma.materia.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { nombre: 'Lengua Española' },
      });
      expect(resultado.nombre).toBe('Lengua Española');
    });

    it('actualiza la clave de la materia', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findFirst
        .mockResolvedValueOnce({
          id: 5,
          gradoId: 2,
          clave: 'ESP-001',
          nombre: 'Español',
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...materiaBase,
          clave: 'ESP-010',
        });
      prisma.materia.update.mockResolvedValue({ id: 5 });

      const resultado = await service.actualizar(5, 1, { clave: 'ESP-010' });

      expect(prisma.materia.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { clave: 'ESP-010' },
      });
      expect(resultado.clave).toBe('ESP-010');
    });

    it('rechaza una clave duplicada al actualizar', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findFirst
        .mockResolvedValueOnce({
          id: 5,
          gradoId: 2,
          clave: 'ESP-001',
          nombre: 'Español',
        })
        .mockResolvedValueOnce({ id: 9 });

      await expect(
        service.actualizar(5, 1, { clave: 'ESP-002' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.materia.update).not.toHaveBeenCalled();
    });

    it('valida el nuevo grado cuando cambia', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findFirst.mockResolvedValue({
        id: 5,
        gradoId: 2,
        clave: 'ESP-001',
        nombre: 'Español',
      });
      prisma.grado.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(5, 1, { gradoId: 3 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.materia.update).not.toHaveBeenCalled();
    });

    it('rechaza una materia inexistente', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(99, 1, { nombre: 'Otra' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('eliminar', () => {
    it('elimina la materia sin asignaciones', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findFirst.mockResolvedValue({ id: 5 });
      prisma.asignacionAcademica.count.mockResolvedValue(0);
      prisma.materia.delete.mockResolvedValue({ id: 5 });

      const resultado = await service.eliminar(5, 1);

      expect(prisma.materia.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(resultado).toEqual({
        id: 5,
        mensaje: 'Materia eliminada correctamente',
      });
    });

    it('no elimina una materia con asignaciones académicas', async () => {
      prisma.escuela.findUnique.mockResolvedValue({ id: 1 });
      prisma.materia.findFirst.mockResolvedValue({ id: 5 });
      prisma.asignacionAcademica.count.mockResolvedValue(2);

      await expect(service.eliminar(5, 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.materia.delete).not.toHaveBeenCalled();
    });
  });
});
