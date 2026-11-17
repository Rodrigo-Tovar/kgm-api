ALTER TABLE public.administrador
  ADD COLUMN IF NOT EXISTS fotourl TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS usuario_email_lower_key
  ON public.usuario (lower(email));
