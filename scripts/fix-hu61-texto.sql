-- Corrige los textos de prueba de HU-6.1 sin depender de la codificacion
-- de PowerShell. El archivo usa solo caracteres ASCII y genera los acentos
-- dentro de PostgreSQL con chr(...).

DO $$
DECLARE
  v_escuela INT;
BEGIN
  SELECT id INTO v_escuela
  FROM escuela
  WHERE clave = 'KGM-DEMO'
  ORDER BY id
  LIMIT 1;

  IF v_escuela IS NULL THEN
    RAISE EXCEPTION 'No existe la escuela KGM-DEMO';
  END IF;

  UPDATE grado
  SET nombre = '5' || chr(176)
  WHERE escuelaid = v_escuela
    AND nombre LIKE '5%';

  UPDATE materia
  SET nombre = 'Matem' || chr(225) || 'ticas'
  WHERE escuelaid = v_escuela
    AND nombre LIKE 'Matem%';

  UPDATE materia
  SET nombre = 'Espa' || chr(241) || 'ol'
  WHERE escuelaid = v_escuela
    AND nombre LIKE 'Espa%';

  UPDATE materia
  SET nombre = 'Formaci' || chr(243) || 'n'
  WHERE escuelaid = v_escuela
    AND nombre LIKE 'Formaci%';

  UPDATE materia
  SET nombre = 'Ingl' || chr(233) || 's'
  WHERE escuelaid = v_escuela
    AND nombre LIKE 'Ingl%';

  UPDATE alumno
  SET
    apellidopaterno = 'Garc' || chr(237) || 'a',
    apellidomaterno = 'L' || chr(243) || 'pez'
  WHERE escuelaid = v_escuela
    AND matricula = 'KGM-HU14-001';

  UPDATE alumno
  SET apellidomaterno = 'R' || chr(237) || 'os'
  WHERE escuelaid = v_escuela
    AND matricula = 'KGM-HU61-002';

  UPDATE alumno
  SET
    nombre = 'Sof' || chr(237) || 'a',
    apellidomaterno = 'D' || chr(237) || 'az'
  WHERE escuelaid = v_escuela
    AND matricula = 'KGM-HU61-003';

  UPDATE alumno
  SET apellidomaterno = 'V' || chr(225) || 'zquez'
  WHERE escuelaid = v_escuela
    AND matricula = 'KGM-HU61-004';

  UPDATE alumno
  SET apellidopaterno = 'G' || chr(243) || 'mez'
  WHERE escuelaid = v_escuela
    AND matricula = 'KGM-HU61-006';

  UPDATE docente
  SET apellidopaterno = 'Ram' || chr(237) || 'rez'
  WHERE escuelaid = v_escuela
    AND curp = 'DOCU800101HSRXXX01';
END $$;
