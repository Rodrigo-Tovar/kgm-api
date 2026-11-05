-- Datos locales de desarrollo para HU-6.1 Reporte de calificaciones.
-- Idempotente y compatible con Windows PowerShell: el archivo usa solo ASCII
-- y genera los caracteres acentuados con chr(...) dentro de PostgreSQL.

DO $$
DECLARE
  v_escuela INT;
  v_ciclo INT;
  v_grado INT;
  v_grupo INT;
  v_docente INT;
BEGIN
  SELECT id INTO v_escuela
  FROM escuela
  WHERE clave = 'KGM-DEMO'
  ORDER BY id
  LIMIT 1;

  IF v_escuela IS NULL THEN
    INSERT INTO escuela (nombre, clave)
    VALUES ('Escuela Demo KGM', 'KGM-DEMO')
    RETURNING id INTO v_escuela;
  END IF;

  SELECT id INTO v_ciclo
  FROM cicloescolar
  WHERE escuelaid = v_escuela
    AND nombre = '2026-2027'
  ORDER BY id
  LIMIT 1;

  IF v_ciclo IS NULL THEN
    INSERT INTO cicloescolar (escuelaid, fechainicio, fechafin, nombre)
    VALUES (v_escuela, '2026-08-17', '2027-07-09', '2026-2027')
    RETURNING id INTO v_ciclo;
  END IF;

  SELECT id INTO v_grado
  FROM grado
  WHERE escuelaid = v_escuela
    AND nombre = ('5' || chr(176))
  ORDER BY id
  LIMIT 1;

  IF v_grado IS NULL THEN
    INSERT INTO grado (escuelaid, nombre)
    VALUES (v_escuela, '5' || chr(176))
    RETURNING id INTO v_grado;
  END IF;

  SELECT id INTO v_grupo
  FROM grupo
  WHERE escuelaid = v_escuela
    AND gradoid = v_grado
    AND nombre = 'A'
  ORDER BY id
  LIMIT 1;

  IF v_grupo IS NULL THEN
    INSERT INTO grupo (escuelaid, gradoid, nombre)
    VALUES (v_escuela, v_grado, 'A')
    RETURNING id INTO v_grupo;
  END IF;

  SELECT id INTO v_docente
  FROM docente
  WHERE curp = 'DOCU800101HSRXXX01'
  LIMIT 1;

  IF v_docente IS NULL THEN
    INSERT INTO docente (
      escuelaid,
      curp,
      nombre,
      apellidopaterno,
      apellidomaterno,
      estado
    )
    VALUES (
      v_escuela,
      'DOCU800101HSRXXX01',
      'Laura',
      'Ram' || chr(237) || 'rez',
      'Soto',
      'ACTIVO'
    )
    RETURNING id INTO v_docente;
  END IF;

  INSERT INTO alumno (
    escuelaid,
    matricula,
    curp,
    nombre,
    apellidopaterno,
    apellidomaterno,
    fechanacimiento,
    nacionalidad,
    genero,
    direccion
  )
  VALUES
    (
      v_escuela,
      'KGM-HU14-001',
      'GALA160101MDFRPN01',
      'Ana',
      'Garc' || chr(237) || 'a',
      'L' || chr(243) || 'pez',
      '2016-01-01',
      'Mexicana',
      'Femenino',
      'Domicilio demo'
    ),
    (
      v_escuela,
      'KGM-HU61-002',
      'MERL160202MSRNXS02',
      'Luis',
      'Mendoza',
      'R' || chr(237) || 'os',
      '2016-02-02',
      'Mexicana',
      'Masculino',
      'Domicilio demo'
    ),
    (
      v_escuela,
      'KGM-HU61-003',
      'NADS160303MSRVZF03',
      'Sof' || chr(237) || 'a',
      'Navarro',
      'D' || chr(237) || 'az',
      '2016-03-03',
      'Mexicana',
      'Femenino',
      'Domicilio demo'
    ),
    (
      v_escuela,
      'KGM-HU61-004',
      'FOVD160404HSRLZG04',
      'Diego',
      'Flores',
      'V' || chr(225) || 'zquez',
      '2016-04-04',
      'Mexicana',
      'Masculino',
      'Domicilio demo'
    ),
    (
      v_escuela,
      'KGM-HU61-005',
      'CAVV160505MSRSRL05',
      'Valentina',
      'Castro',
      'Romero',
      '2016-05-05',
      'Mexicana',
      'Femenino',
      'Domicilio demo'
    ),
    (
      v_escuela,
      'KGM-HU61-006',
      'GOSM160606HSRLTA06',
      'Mateo',
      'G' || chr(243) || 'mez',
      'Salazar',
      '2016-06-06',
      'Mexicana',
      'Masculino',
      'Domicilio demo'
    )
  ON CONFLICT (matricula) DO NOTHING;

  INSERT INTO materia (escuelaid, gradoid, nombre)
  SELECT v_escuela, v_grado, nombre
  FROM (
    VALUES
      ('Matem' || chr(225) || 'ticas'),
      ('Espa' || chr(241) || 'ol'),
      ('Ciencias'),
      ('Formaci' || chr(243) || 'n'),
      ('Ingl' || chr(233) || 's')
  ) AS m(nombre)
  WHERE NOT EXISTS (
    SELECT 1
    FROM materia x
    WHERE x.escuelaid = v_escuela
      AND x.gradoid = v_grado
      AND x.nombre = m.nombre
  );

  INSERT INTO alumnogrupo (
    escuelaid,
    alumnoid,
    grupoid,
    cicloid,
    activo,
    turno,
    fechaingreso
  )
  SELECT
    v_escuela,
    a.id,
    v_grupo,
    v_ciclo,
    true,
    'Matutino',
    '2026-08-17'
  FROM alumno a
  WHERE a.escuelaid = v_escuela
    AND a.matricula IN (
      'KGM-HU14-001',
      'KGM-HU61-002',
      'KGM-HU61-003',
      'KGM-HU61-004',
      'KGM-HU61-005',
      'KGM-HU61-006'
    )
  ON CONFLICT (alumnoid, cicloid)
  DO UPDATE SET
    grupoid = EXCLUDED.grupoid,
    activo = true;

  INSERT INTO asignacionacademica (
    escuelaid,
    cicloid,
    grupoid,
    materiaid,
    docenteid,
    activo
  )
  SELECT
    v_escuela,
    v_ciclo,
    v_grupo,
    m.id,
    v_docente,
    true
  FROM materia m
  WHERE m.escuelaid = v_escuela
    AND m.gradoid = v_grado
    AND m.nombre IN (
      'Matem' || chr(225) || 'ticas',
      'Espa' || chr(241) || 'ol',
      'Ciencias',
      'Formaci' || chr(243) || 'n',
      'Ingl' || chr(233) || 's'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM asignacionacademica aa
      WHERE aa.escuelaid = v_escuela
        AND aa.cicloid = v_ciclo
        AND aa.grupoid = v_grupo
        AND aa.materiaid = m.id
    );
END $$;

WITH notas(matricula, materia, valor) AS (
  VALUES
    ('KGM-HU14-001', 'Matem' || chr(225) || 'ticas', 8.0),
    ('KGM-HU14-001', 'Espa' || chr(241) || 'ol', 9.0),
    ('KGM-HU14-001', 'Ciencias', 8.0),
    ('KGM-HU14-001', 'Formaci' || chr(243) || 'n', 9.0),
    ('KGM-HU14-001', 'Ingl' || chr(233) || 's', 9.0),

    ('KGM-HU61-002', 'Matem' || chr(225) || 'ticas', 7.0),
    ('KGM-HU61-002', 'Espa' || chr(241) || 'ol', 8.0),
    ('KGM-HU61-002', 'Ciencias', 7.0),
    ('KGM-HU61-002', 'Formaci' || chr(243) || 'n', 8.0),
    ('KGM-HU61-002', 'Ingl' || chr(233) || 's', 8.0),

    ('KGM-HU61-003', 'Matem' || chr(225) || 'ticas', 9.0),
    ('KGM-HU61-003', 'Espa' || chr(241) || 'ol', 9.0),
    ('KGM-HU61-003', 'Ciencias', 9.0),
    ('KGM-HU61-003', 'Formaci' || chr(243) || 'n', 9.0),
    ('KGM-HU61-003', 'Ingl' || chr(233) || 's', 9.0),

    ('KGM-HU61-004', 'Matem' || chr(225) || 'ticas', 6.0),
    ('KGM-HU61-004', 'Espa' || chr(241) || 'ol', 7.0),
    ('KGM-HU61-004', 'Ciencias', 6.0),
    ('KGM-HU61-004', 'Formaci' || chr(243) || 'n', 7.0),
    ('KGM-HU61-004', 'Ingl' || chr(233) || 's', 7.0),

    ('KGM-HU61-005', 'Matem' || chr(225) || 'ticas', 5.0),
    ('KGM-HU61-005', 'Espa' || chr(241) || 'ol', 6.0),
    ('KGM-HU61-005', 'Ciencias', 5.0),
    ('KGM-HU61-005', 'Formaci' || chr(243) || 'n', 6.0),
    ('KGM-HU61-005', 'Ingl' || chr(233) || 's', 6.0),

    ('KGM-HU61-006', 'Matem' || chr(225) || 'ticas', 4.0),
    ('KGM-HU61-006', 'Espa' || chr(241) || 'ol', 5.0),
    ('KGM-HU61-006', 'Ciencias', 4.0),
    ('KGM-HU61-006', 'Formaci' || chr(243) || 'n', 5.0),
    ('KGM-HU61-006', 'Ingl' || chr(233) || 's', 5.0)
)
INSERT INTO calificacion (
  escuelaid,
  asignacionacademicaid,
  alumnoid,
  periodo,
  valor
)
SELECT
  a.escuelaid,
  aa.id,
  a.id,
  '1er periodo',
  n.valor
FROM notas n
JOIN alumno a
  ON a.matricula = n.matricula
JOIN materia m
  ON m.escuelaid = a.escuelaid
  AND m.nombre = n.materia
JOIN alumnogrupo ag
  ON ag.alumnoid = a.id
  AND ag.activo = true
JOIN asignacionacademica aa
  ON aa.escuelaid = a.escuelaid
  AND aa.cicloid = ag.cicloid
  AND aa.grupoid = ag.grupoid
  AND aa.materiaid = m.id
ON CONFLICT (asignacionacademicaid, alumnoid, periodo)
DO UPDATE SET
  valor = EXCLUDED.valor,
  fecharegistro = CURRENT_TIMESTAMP;
