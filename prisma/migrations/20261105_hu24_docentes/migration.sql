ALTER TABLE public.docente
  ADD COLUMN IF NOT EXISTS fechanacimiento DATE,
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(50),
  ADD COLUMN IF NOT EXISTS correo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS fotourl TEXT;

ALTER TABLE public.docente
  DROP CONSTRAINT IF EXISTS docente_curp_key;

DROP INDEX IF EXISTS public.docente_curp_key;

CREATE UNIQUE INDEX IF NOT EXISTS docente_escuelaid_curp_key
  ON public.docente (escuelaid, curp);

CREATE UNIQUE INDEX IF NOT EXISTS docente_escuelaid_correo_key
  ON public.docente (escuelaid, correo);
