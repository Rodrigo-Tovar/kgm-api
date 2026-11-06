ALTER TABLE public.tutor
  ALTER COLUMN parentesco SET NOT NULL;

ALTER TABLE public.tutor
  DROP CONSTRAINT IF EXISTS tutor_curp_key;

CREATE UNIQUE INDEX IF NOT EXISTS tutor_escuelaid_curp_key
	ON public.tutor (escuelaid, curp);
