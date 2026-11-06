ALTER TABLE public.tutor
  ALTER COLUMN parentesco DROP NOT NULL;

DROP INDEX IF EXISTS public.tutor_curp_key;

CREATE UNIQUE INDEX IF NOT EXISTS tutor_escuelaid_curp_key
  ON public.tutor (escuelaid, curp)
  WHERE curp IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tutor_escuelaid_correo_key
  ON public.tutor (escuelaid, correo)
  WHERE correo IS NOT NULL;