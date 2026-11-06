import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL es obligatorio para ejecutar la seed.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const fecha = (valor: string) => new Date(`${valor}T00:00:00.000Z`);

async function main() {
  const escuela = await prisma.escuela.findFirst({
    where: { clave: 'DEV-001' },
  });
  const escuelaDesarrollo = escuela
    ? await prisma.escuela.update({
        where: { id: escuela.id },
        data: { nombre: 'Escuela KGM de Desarrollo' },
      })
    : await prisma.escuela.create({
        data: { nombre: 'Escuela KGM de Desarrollo', clave: 'DEV-001' },
      });

  const ciclosSemilla = [
    {
      nombre: '2025-2026',
      fechaInicio: fecha('2025-08-25'),
      fechaFin: fecha('2026-07-15'),
    },
    {
      nombre: '2026-2027',
      fechaInicio: fecha('2026-08-24'),
      fechaFin: fecha('2027-07-14'),
    },
  ];
  const ciclos = new Map<string, { id: number }>();
  for (const datos of ciclosSemilla) {
    const existente = await prisma.cicloEscolar.findFirst({
      where: { escuelaId: escuelaDesarrollo.id, nombre: datos.nombre },
    });
    const ciclo = existente
      ? await prisma.cicloEscolar.update({
          where: { id: existente.id },
          data: datos,
        })
      : await prisma.cicloEscolar.create({
          data: { ...datos, escuelaId: escuelaDesarrollo.id },
        });
    ciclos.set(datos.nombre, ciclo);
  }

  const grados = new Map<string, { id: number }>();
  for (const nombre of ['1ro', '2do', '3ro', '4to', '5to', '6to']) {
    const existente = await prisma.grado.findFirst({
      where: { escuelaId: escuelaDesarrollo.id, nombre },
    });
    const grado = existente
      ? await prisma.grado.update({
          where: { id: existente.id },
          data: { nombre },
        })
      : await prisma.grado.create({
          data: { escuelaId: escuelaDesarrollo.id, nombre },
        });
    grados.set(nombre, grado);
  }

  const grupos = new Map<string, { id: number; gradoId: number }>();
  for (const nombreGrado of ['1ro', '2do', '3ro']) {
    const grado = grados.get(nombreGrado);
    if (!grado) throw new Error(`No se encontró el grado ${nombreGrado}.`);

    for (const nombreGrupo of ['A', 'B']) {
      const existente = await prisma.grupo.findFirst({
        where: {
          escuelaId: escuelaDesarrollo.id,
          gradoId: grado.id,
          nombre: nombreGrupo,
        },
      });
      const grupo = existente
        ? await prisma.grupo.update({
            where: { id: existente.id },
            data: { nombre: nombreGrupo },
          })
        : await prisma.grupo.create({
            data: {
              escuelaId: escuelaDesarrollo.id,
              gradoId: grado.id,
              nombre: nombreGrupo,
            },
          });
      grupos.set(`${nombreGrado}-${nombreGrupo}`, grupo);
    }
  }

  const materiasPorGrado = new Map<string, Array<{ id: number }>>();
  const materiasPorClave = new Map<string, { id: number }>();
  const nombresMaterias = ['Español', 'Matemáticas', 'Ciencias Naturales'];
  for (const nombreGrado of ['1ro', '2do', '3ro']) {
    const grado = grados.get(nombreGrado);
    if (!grado) throw new Error(`No se encontró el grado ${nombreGrado}.`);

    const materias: Array<{ id: number }> = [];
    for (const nombre of nombresMaterias) {
      const existente = await prisma.materia.findFirst({
        where: {
          escuelaId: escuelaDesarrollo.id,
          gradoId: grado.id,
          nombre,
        },
      });
      const materia = existente
        ? await prisma.materia.update({
            where: { id: existente.id },
            data: { nombre },
          })
        : await prisma.materia.create({
            data: { escuelaId: escuelaDesarrollo.id, gradoId: grado.id, nombre },
          });
      materias.push(materia);
      materiasPorClave.set(`${nombreGrado}:${nombre}`, materia);
    }
    materiasPorGrado.set(nombreGrado, materias);
  }

  const docentesSemilla = [
    {
      curp: 'GODE900101HDFRPN01',
      nombre: 'Elena',
      apellidoPaterno: 'Cruz',
      apellidoMaterno: 'Sánchez',
      fechaNacimiento: fecha('1990-01-01'),
      telefono: '5551001001',
      correo: 'elena.cruz@demo.kgm.test',
      direccion: 'Av. Escuela 100, Centro',
      estado: 'ACTIVO',
    },
    {
      curp: 'MATT850215HDFRPN02',
      nombre: 'Carlos',
      apellidoPaterno: 'Martínez',
      apellidoMaterno: 'Torres',
      fechaNacimiento: fecha('1985-02-15'),
      telefono: '5551001002',
      correo: 'carlos.martinez@demo.kgm.test',
      direccion: 'Calle del Saber 25',
      estado: 'ACTIVO',
    },
    {
      curp: 'TORS820310MDFRPN03',
      nombre: 'Sofía',
      apellidoPaterno: 'Torres',
      apellidoMaterno: 'Ramírez',
      fechaNacimiento: fecha('1982-03-10'),
      telefono: '5551001003',
      correo: 'sofia.torres@demo.kgm.test',
      direccion: 'Privada de los Libros 12',
      estado: 'ACTIVO',
    },
    {
      curp: 'RUGM840522HDFRPN04',
      nombre: 'Miguel',
      apellidoPaterno: 'Ruiz',
      apellidoMaterno: 'Gómez',
      fechaNacimiento: fecha('1984-05-22'),
      telefono: '5551001004',
      correo: 'miguel.ruiz@demo.kgm.test',
      direccion: 'Calle Reforma 45',
      estado: 'INACTIVO',
    },
  ];
  const docentes = new Map<string, { id: number }>();
  for (const datos of docentesSemilla) {
    const existente = await prisma.docente.findFirst({
      where: { escuelaId: escuelaDesarrollo.id, curp: datos.curp },
    });
    const docente = existente
      ? await prisma.docente.update({
          where: { id: existente.id },
          data: datos,
        })
      : await prisma.docente.create({
          data: { ...datos, escuelaId: escuelaDesarrollo.id },
        });
    docentes.set(datos.curp, docente);
  }

  const alumnosSemilla = [
    {
      matricula: 'DEMO-ALU-001',
      curp: 'ALPA150410HDFRNN01',
      nombre: 'Andrés',
      apellidoPaterno: 'López',
      apellidoMaterno: 'Pérez',
      fechaNacimiento: fecha('2015-04-10'),
      genero: 'Masculino',
      nacionalidad: 'Mexicana',
      direccion: 'Calle Naranjo 10',
      telefono: '5552001001',
      correo: 'andres.lopez@alumnos.kgm.test',
      grupo: '1ro-A',
    },
    {
      matricula: 'DEMO-ALU-002',
      curp: 'BECR150822MDFRNN02',
      nombre: 'Beatriz',
      apellidoPaterno: 'Cruz',
      apellidoMaterno: 'Ramírez',
      fechaNacimiento: fecha('2015-08-22'),
      genero: 'Femenino',
      nacionalidad: 'Mexicana',
      direccion: 'Av. Roble 22',
      telefono: '5552001002',
      correo: 'beatriz.cruz@alumnos.kgm.test',
      grupo: '1ro-A',
    },
    {
      matricula: 'DEMO-ALU-003',
      curp: 'CAMA160203HDFRNN03',
      nombre: 'Camila',
      apellidoPaterno: 'Martínez',
      apellidoMaterno: 'Alonso',
      fechaNacimiento: fecha('2016-02-03'),
      genero: 'Femenino',
      nacionalidad: 'Mexicana',
      direccion: 'Calle Olmo 8',
      telefono: '5552001003',
      correo: 'camila.martinez@alumnos.kgm.test',
      grupo: '1ro-A',
    },
    {
      matricula: 'DEMO-ALU-004',
      curp: 'DASA150519MDFRNN04',
      nombre: 'Daniela',
      apellidoPaterno: 'Sánchez',
      apellidoMaterno: 'Aguilar',
      fechaNacimiento: fecha('2015-05-19'),
      genero: 'Femenino',
      nacionalidad: 'Mexicana',
      direccion: 'Cerrada del Sol 16',
      telefono: '5552001004',
      correo: 'daniela.sanchez@alumnos.kgm.test',
      grupo: '1ro-B',
    },
    {
      matricula: 'DEMO-ALU-005',
      curp: 'EVGA150911HDFRNN05',
      nombre: 'Emiliano',
      apellidoPaterno: 'Vega',
      apellidoMaterno: 'García',
      fechaNacimiento: fecha('2015-09-11'),
      genero: 'Masculino',
      nacionalidad: 'Mexicana',
      direccion: 'Calle Cedro 31',
      telefono: '5552001005',
      correo: 'emiliano.vega@alumnos.kgm.test',
      grupo: '1ro-B',
    },
    {
      matricula: 'DEMO-ALU-006',
      curp: 'FEMO140714MDFRNN06',
      nombre: 'Fernanda',
      apellidoPaterno: 'Molina',
      apellidoMaterno: 'Ortega',
      fechaNacimiento: fecha('2014-07-14'),
      genero: 'Femenino',
      nacionalidad: 'Mexicana',
      direccion: 'Privada del Parque 4',
      telefono: '5552001006',
      correo: 'fernanda.molina@alumnos.kgm.test',
      grupo: '2do-A',
    },
    {
      matricula: 'DEMO-ALU-007',
      curp: 'GOPA140126HDFRNN07',
      nombre: 'Gael',
      apellidoPaterno: 'Ponce',
      apellidoMaterno: 'Arias',
      fechaNacimiento: fecha('2014-01-26'),
      genero: 'Masculino',
      nacionalidad: 'Mexicana',
      direccion: 'Calle Jazmín 19',
      telefono: '5552001007',
      correo: 'gael.ponce@alumnos.kgm.test',
      grupo: '2do-A',
    },
    {
      matricula: 'DEMO-ALU-008',
      curp: 'HERO140630MDFRNN08',
      nombre: 'Hugo',
      apellidoPaterno: 'Reyes',
      apellidoMaterno: 'Ochoa',
      fechaNacimiento: fecha('2014-06-30'),
      genero: 'Masculino',
      nacionalidad: 'Mexicana',
      direccion: 'Av. Primavera 50',
      telefono: '5552001008',
      correo: 'hugo.reyes@alumnos.kgm.test',
      grupo: '2do-B',
    },
  ];
  const alumnos = new Map<
    string,
    { id: number; grupo: string }
  >();
  for (const datos of alumnosSemilla) {
    const { grupo: grupoNombre, ...datosAlumno } = datos;
    const existente = await prisma.alumno.findUnique({
      where: { matricula: datos.matricula },
    });
    const alumno = existente
      ? await prisma.alumno.update({
          where: { id: existente.id },
          data: { ...datosAlumno, escuelaId: escuelaDesarrollo.id },
        })
      : await prisma.alumno.create({
          data: { ...datosAlumno, escuelaId: escuelaDesarrollo.id },
        });
    alumnos.set(datos.matricula, { id: alumno.id, grupo: grupoNombre });
  }

  const tutoresSemilla = [
    {
      curp: 'TOPE800101MDFRNR01',
      nombre: 'Patricia',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'Esquivel',
      parentesco: 'Madre',
      correo: 'patricia.perez@familias.kgm.test',
      telefono: '5553001001',
      direccion: 'Calle Naranjo 10',
      matriculas: ['DEMO-ALU-001', 'DEMO-ALU-002'],
    },
    {
      curp: 'LOCA780425HDFRNR02',
      nombre: 'Roberto',
      apellidoPaterno: 'López',
      apellidoMaterno: 'Castro',
      parentesco: 'Padre',
      correo: 'roberto.lopez@familias.kgm.test',
      telefono: '5553001002',
      direccion: 'Calle Naranjo 10',
      matriculas: ['DEMO-ALU-001'],
    },
    {
      curp: 'SAMA810909MDFRNR03',
      nombre: 'Claudia',
      apellidoPaterno: 'Sánchez',
      apellidoMaterno: 'Mora',
      parentesco: 'Madre',
      correo: 'claudia.sanchez@familias.kgm.test',
      telefono: '5553001003',
      direccion: 'Cerrada del Sol 16',
      matriculas: ['DEMO-ALU-004', 'DEMO-ALU-005'],
    },
    {
      curp: 'MOGA790318HDFRNR04',
      nombre: 'Jorge',
      apellidoPaterno: 'Molina',
      apellidoMaterno: 'García',
      parentesco: 'Tutor',
      correo: 'jorge.molina@familias.kgm.test',
      telefono: '5553001004',
      direccion: 'Privada del Parque 4',
      matriculas: ['DEMO-ALU-006', 'DEMO-ALU-007'],
    },
  ];
  const tutores = new Map<string, { id: number }>();
  for (const datos of tutoresSemilla) {
    const { matriculas, ...datosTutor } = datos;
    const existente = await prisma.tutor.findUnique({
      where: { curp: datos.curp },
    });
    const tutor = existente
      ? await prisma.tutor.update({
          where: { id: existente.id },
          data: { ...datosTutor, escuelaId: escuelaDesarrollo.id },
        })
      : await prisma.tutor.create({
          data: { ...datosTutor, escuelaId: escuelaDesarrollo.id },
        });
    tutores.set(datos.curp, tutor);

    for (const matricula of matriculas) {
      const alumno = alumnos.get(matricula);
      if (!alumno) throw new Error(`No se encontró al alumno ${matricula}.`);
      const relacion = await prisma.alumnoTutor.findUnique({
        where: { alumnoId_tutorId: { alumnoId: alumno.id, tutorId: tutor.id } },
      });
      const esPrincipal = matricula === 'DEMO-ALU-001'
        ? datos.curp === 'TOPE800101MDFRNR01'
        : true;
      if (relacion) {
        await prisma.alumnoTutor.update({
          where: { id: relacion.id },
          data: { escuelaId: escuelaDesarrollo.id, esPrincipal },
        });
      } else {
        await prisma.alumnoTutor.create({
          data: {
            escuelaId: escuelaDesarrollo.id,
            alumnoId: alumno.id,
            tutorId: tutor.id,
            esPrincipal,
          },
        });
      }
    }
  }

  const cicloActual = ciclos.get('2026-2027');
  const cicloAnterior = ciclos.get('2025-2026');
  if (!cicloActual || !cicloAnterior) {
    throw new Error('No se pudieron preparar los ciclos escolares.');
  }

  const fechaCreacionCicloAnterior = new Date('2025-08-25T12:00:00.000Z');
  const inscripcionesActuales = new Map<number, string>();
  for (const [matricula, datosAlumno] of alumnos) {
    const grupo = grupos.get(datosAlumno.grupo);
    if (!grupo) throw new Error(`No se encontró el grupo ${datosAlumno.grupo}.`);
    const existente = await prisma.alumnoGrupo.findUnique({
      where: {
        alumnoId_cicloId: { alumnoId: datosAlumno.id, cicloId: cicloActual.id },
      },
    });
    const inscripcion = existente
      ? await prisma.alumnoGrupo.update({
          where: { id: existente.id },
          data: {
            escuelaId: escuelaDesarrollo.id,
            grupoId: grupo.id,
            activo: true,
            turno: 'Matutino',
            fechaIngreso: fecha('2026-08-24'),
            observaciones: 'Inscripción de datos de desarrollo.',
          },
        })
      : await prisma.alumnoGrupo.create({
          data: {
            escuelaId: escuelaDesarrollo.id,
            alumnoId: datosAlumno.id,
            grupoId: grupo.id,
            cicloId: cicloActual.id,
            activo: true,
            turno: 'Matutino',
            fechaIngreso: fecha('2026-08-24'),
            observaciones: 'Inscripción de datos de desarrollo.',
          },
        });
    inscripcionesActuales.set(inscripcion.alumnoId, datosAlumno.grupo);
  }

  for (const matricula of ['DEMO-ALU-001', 'DEMO-ALU-002']) {
    const alumno = alumnos.get(matricula);
    const grupo = grupos.get('1ro-A');
    if (!alumno || !grupo) {
      throw new Error('Faltan datos para la inscripción del ciclo anterior.');
    }
    const existente = await prisma.alumnoGrupo.findUnique({
      where: {
        alumnoId_cicloId: { alumnoId: alumno.id, cicloId: cicloAnterior.id },
      },
    });
    if (existente) {
      await prisma.alumnoGrupo.update({
        where: { id: existente.id },
        data: {
          escuelaId: escuelaDesarrollo.id,
          grupoId: grupo.id,
          activo: true,
          createdAt: fechaCreacionCicloAnterior,
        },
      });
    } else {
      await prisma.alumnoGrupo.create({
        data: {
          escuelaId: escuelaDesarrollo.id,
          alumnoId: alumno.id,
          grupoId: grupo.id,
          cicloId: cicloAnterior.id,
          activo: true,
          turno: 'Matutino',
          fechaIngreso: fecha('2025-08-25'),
          createdAt: fechaCreacionCicloAnterior,
        },
      });
    }
  }

  const asignaciones = new Map<string, { id: number }>();
  const asignacionesSemilla = [
    { grupo: '1ro-A', materia: 'Español', docente: 'GODE900101HDFRPN01' },
    { grupo: '1ro-A', materia: 'Matemáticas', docente: 'MATT850215HDFRPN02' },
    { grupo: '1ro-A', materia: 'Ciencias Naturales', docente: 'TORS820310MDFRPN03' },
    { grupo: '1ro-B', materia: 'Español', docente: 'GODE900101HDFRPN01' },
    { grupo: '1ro-B', materia: 'Matemáticas', docente: 'MATT850215HDFRPN02' },
    { grupo: '1ro-B', materia: 'Ciencias Naturales', docente: 'TORS820310MDFRPN03' },
    { grupo: '2do-A', materia: 'Español', docente: 'GODE900101HDFRPN01' },
    { grupo: '2do-A', materia: 'Matemáticas', docente: 'MATT850215HDFRPN02' },
    { grupo: '2do-A', materia: 'Ciencias Naturales', docente: 'RUGM840522HDFRPN04' },
    { grupo: '2do-B', materia: 'Español', docente: 'GODE900101HDFRPN01' },
    { grupo: '2do-B', materia: 'Matemáticas', docente: 'MATT850215HDFRPN02' },
    { grupo: '2do-B', materia: 'Ciencias Naturales', docente: 'RUGM840522HDFRPN04' },
  ];

  for (const datos of asignacionesSemilla) {
    const grupo = grupos.get(datos.grupo);
    const docente = docentes.get(datos.docente);
    const materia = materiasPorClave.get(
      `${datos.grupo.split('-')[0]}:${datos.materia}`,
    );
    if (!grupo || !docente || !materia) {
      throw new Error(`No se pudieron preparar los datos de ${datos.grupo}.`);
    }

    const existente = await prisma.asignacionAcademica.findFirst({
      where: {
        escuelaId: escuelaDesarrollo.id,
        cicloId: cicloActual.id,
        grupoId: grupo.id,
        materiaId: materia.id,
      },
    });
    const asignacion = existente
      ? await prisma.asignacionAcademica.update({
          where: { id: existente.id },
          data: { docenteId: docente.id, activo: true },
        })
      : await prisma.asignacionAcademica.create({
          data: {
            escuelaId: escuelaDesarrollo.id,
            cicloId: cicloActual.id,
            grupoId: grupo.id,
            materiaId: materia.id,
            docenteId: docente.id,
            activo: true,
          },
        });
    asignaciones.set(`${datos.grupo}:${datos.materia}`, asignacion);
  }

  const notasPorAlumno = [
    [9, 8.5, 9.5],
    [7.5, 8, 8.5],
    [6, 6.5, 7],
    [5.5, 6, 5],
    [8, 7.5, 8.5],
    [5, 5.5, 6],
    [9.5, 9, 8.5],
    [7, 7.5, 7],
  ];
  const periodos = ['Bimestre 1', 'Bimestre 2'];
  let indiceAlumno = 0;
  for (const [matricula, alumno] of alumnos) {
    const grupoNombre = inscripcionesActuales.get(alumno.id);
    if (!grupoNombre) throw new Error(`No se encontró inscripción para ${matricula}.`);
    const grupo = grupos.get(grupoNombre);
    if (!grupo) throw new Error(`No se encontró el grupo ${grupoNombre}.`);
    const materias = materiasPorGrado.get(grupoNombre.split('-')[0]) ?? [];

    for (const [indiceMateria, materia] of materias.entries()) {
      const nombreMateria = nombresMaterias[indiceMateria];
      const asignacion = asignaciones.get(`${grupoNombre}:${nombreMateria}`);
      if (!asignacion) continue;

      for (const [indicePeriodo, periodo] of periodos.entries()) {
        const valores = notasPorAlumno[indiceAlumno % notasPorAlumno.length];
        const nota = valores[indiceMateria] - (indicePeriodo === 0 ? 0 : 0.25);
        await prisma.calificacion.upsert({
          where: {
            asignacionAcademicaId_alumnoId_periodo: {
              asignacionAcademicaId: asignacion.id,
              alumnoId: alumno.id,
              periodo,
            },
          },
          update: {
            escuelaId: escuelaDesarrollo.id,
            valor: nota,
          },
          create: {
            escuelaId: escuelaDesarrollo.id,
            asignacionAcademicaId: asignacion.id,
            alumnoId: alumno.id,
            periodo,
            valor: nota,
          },
        });
      }
    }

    const expediente = await prisma.expedienteAcademico.findUnique({
      where: { alumnoId: alumno.id },
    });
    if (expediente) {
      await prisma.expedienteAcademico.update({
        where: { id: expediente.id },
        data: { escuelaId: escuelaDesarrollo.id },
      });
    } else {
      await prisma.expedienteAcademico.create({
        data: { escuelaId: escuelaDesarrollo.id, alumnoId: alumno.id },
      });
    }
    indiceAlumno += 1;
  }

  console.log(`Seed de desarrollo completada para escuela ${escuelaDesarrollo.id}.`);
  console.log(
    `${docentes.size} docentes, ${alumnos.size} alumnos, ${tutores.size} tutores, ` +
      `${grados.size} grados, ${grupos.size} grupos, ${ciclos.size} ciclos y ` +
      `${asignaciones.size} asignaciones académicas preparados.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Error al ejecutar la seed de desarrollo:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
