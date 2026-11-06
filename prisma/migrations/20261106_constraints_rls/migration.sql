DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.usuario'::regclass
      AND conname = 'usuario_rol_check'
  ) THEN
    ALTER TABLE public.usuario
      ADD CONSTRAINT usuario_rol_check
      CHECK (rol IN ('ADMINISTRADOR', 'DOCENTE', 'TUTOR'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.calificacion'::regclass
      AND conname = 'calificacion_valor_check'
  ) THEN
    ALTER TABLE public.calificacion
      ADD CONSTRAINT calificacion_valor_check
      CHECK (valor >= 0 AND valor <= 10);
  END IF;
END $$;

ALTER TABLE public.escuela ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cicloescolar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignacionacademica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedienteacademico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnotutor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnogrupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificacion ENABLE ROW LEVEL SECURITY;
