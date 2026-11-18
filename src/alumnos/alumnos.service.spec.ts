import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlumnosService } from './alumnos.service';

describe('AlumnosService assignments', () => {
  let service: AlumnosService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      escuela: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) },
      alumno: { findFirst: jest.fn().mockResolvedValue({ id: 8 }) },
      alumnoGrupo: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new AlumnosService(prisma as PrismaService);
  });

  it('rejects a second active assignment even when it targets another cycle', async () => {
    prisma.alumnoGrupo.findFirst.mockResolvedValue({
      id: 12,
      grupo: { nombre: 'A', grado: { nombre: '3ro' } },
      ciclo: {
        nombre: '2026-2027',
        fechaInicio: new Date('2026-08-01T00:00:00.000Z'),
        fechaFin: new Date('2027-06-30T00:00:00.000Z'),
      },
    });

    await expect(
      service.crearAsignacion(8, 1, {
        cicloId: 3,
        gradoId: 4,
        grupoId: 5,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.alumnoGrupo.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { alumnoId: 8, escuelaId: 1, activo: true },
      }),
    );
    expect(prisma.alumnoGrupo.create).not.toHaveBeenCalled();
  });
});
