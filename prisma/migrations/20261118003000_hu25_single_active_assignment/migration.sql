-- Keep the newest active assignment and preserve earlier rows as inactive history.
WITH active_assignments AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY alumnoid
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS position
  FROM public.alumnogrupo
  WHERE activo IS TRUE
)
UPDATE public.alumnogrupo AS assignment
SET activo = FALSE
FROM active_assignments
WHERE assignment.id = active_assignments.id
  AND active_assignments.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS alumnogrupo_unico_activo_por_alumno_idx
  ON public.alumnogrupo (alumnoid)
  WHERE activo IS TRUE;
