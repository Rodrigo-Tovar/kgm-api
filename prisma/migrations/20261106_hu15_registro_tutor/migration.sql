ALTER TABLE public.tutor
  ALTER COLUMN parentesco SET NOT NULL;

ALTER TABLE public.tutor
  DROP CONSTRAINT IF EXISTS tutor_curp_key;

ALTER TABLE public.tutor
  ADD CONSTRAINT tutor_escuelaid_curp_key UNIQUE (escuelaid, curp);
