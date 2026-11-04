-- Habilitar extensión para generar UUIDs si se requieren en el futuro (opcional pero recomendado)
create extension IF not exists "uuid-ossp";

-- =====================================================================================
-- 1. TABLA MAESTRA: ESCUELA (Tenant)
-- =====================================================================================
create table public.Escuela (
  id SERIAL primary key,
  nombre VARCHAR(255) not null,
  clave VARCHAR(100) not null, -- Clave RVOE o identificador oficial
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

-- =====================================================================================
-- 2. TABLA DE USUARIOS Y ROLES (Para HU-4.1 Inicio de Sesión)
-- =====================================================================================
create table public.Usuario (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  email VARCHAR(255) unique not null,
  password VARCHAR(255) not null,
  rol VARCHAR(50) not null check (rol in ('ADMINISTRADOR', 'DOCENTE', 'TUTOR')),
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

-- =====================================================================================
-- 3. TABLAS DE PERFILES (Heredan lógica del Usuario)
-- =====================================================================================
create table public.Administrador (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  usuarioId INT unique not null references public.Usuario (id) on delete CASCADE,
  nombre VARCHAR(255) not null,
  telefono VARCHAR(50),
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create table public.Docente (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  usuarioId INT unique references public.Usuario (id) on delete CASCADE, -- Opcional, por si el docente inicia sesión
  curp VARCHAR(18) unique not null,
  nombre VARCHAR(100) not null,
  apellidoPaterno VARCHAR(100) not null,
  apellidoMaterno VARCHAR(100),
  estado VARCHAR(50) not null default 'ACTIVO',
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

-- =====================================================================================
-- 4. ESTRUCTURA ACADÉMICA (HE-02)
-- =====================================================================================
create table public.CicloEscolar (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  fechaInicio DATE not null,
  fechaFin DATE not null,
  nombre VARCHAR(100), -- Ej. "2026-2027"
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create table public.Grado (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  nombre VARCHAR(50) not null, -- Ej. "1ro", "2do"
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create table public.Grupo (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  gradoId INT not null references public.Grado (id) on delete RESTRICT,
  nombre VARCHAR(50) not null, -- Ej. "A", "B"
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create table public.Materia (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  gradoId INT not null references public.Grado (id) on delete RESTRICT,
  nombre VARCHAR(150) not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create table public.AsignacionAcademica (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  cicloId INT not null references public.CicloEscolar (id) on delete RESTRICT,
  grupoId INT not null references public.Grupo (id) on delete RESTRICT,
  materiaId INT not null references public.Materia (id) on delete RESTRICT,
  docenteId INT not null references public.Docente (id) on delete RESTRICT,
  activo BOOLEAN default true,
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

-- =====================================================================================
-- 5. GESTIÓN DE ALUMNOS (HE-01)
-- =====================================================================================
create table public.Alumno (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  matricula VARCHAR(50) unique not null,
  curp VARCHAR(18) unique not null,
  nombre VARCHAR(100) not null,
  apellidoPaterno VARCHAR(100) not null,
  apellidoMaterno VARCHAR(100),
  fechaNacimiento DATE not null,
  nacionalidad VARCHAR(50),
  genero VARCHAR(50),
  direccion TEXT,
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create table public.ExpedienteAcademico (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  alumnoId INT unique not null references public.Alumno (id) on delete CASCADE,
  rutaArchivoPdf TEXT, -- Ruta donde se guarda el archivo en el Storage de Supabase
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create table public.Tutor (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  usuarioId INT unique references public.Usuario (id) on delete CASCADE, -- Opcional, por si el tutor tiene acceso web
  curp VARCHAR(18) unique,
  nombre VARCHAR(100) not null,
  apellidoPaterno VARCHAR(100) not null,
  apellidoMaterno VARCHAR(100),
  parentesco VARCHAR(50) not null,
  correo VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  created_at timestamp with time zone default CURRENT_TIMESTAMP
);

create table public.AlumnoTutor (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  alumnoId INT not null references public.Alumno (id) on delete CASCADE,
  tutorId INT not null references public.Tutor (id) on delete CASCADE,
  es_principal BOOLEAN default false,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  unique (alumnoId, tutorId)
);

create table public.AlumnoGrupo (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  alumnoId INT not null references public.Alumno (id) on delete CASCADE,
  grupoId INT not null references public.Grupo (id) on delete RESTRICT,
  cicloId INT not null references public.CicloEscolar (id) on delete RESTRICT,
  activo BOOLEAN default true,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  unique (alumnoId, cicloId) -- Un alumno no puede estar en dos grupos en el mismo ciclo
);

-- =====================================================================================
-- 6. GESTIÓN DE CALIFICACIONES (HE-03)
-- =====================================================================================
create table public.Calificacion (
  id SERIAL primary key,
  escuelaId INT not null references public.Escuela (id) on delete CASCADE,
  asignacionAcademicaId INT not null references public.AsignacionAcademica (id) on delete RESTRICT,
  alumnoId INT not null references public.Alumno (id) on delete CASCADE,
  periodo VARCHAR(50) not null, -- Ej. "Bimestre 1"
  valor DECIMAL(4, 2) not null check (
    valor >= 0
    and valor <= 10
  ), -- Rango validado (0-10)
  fechaRegistro timestamp with time zone default CURRENT_TIMESTAMP,
  unique (asignacionAcademicaId, alumnoId, periodo) -- Evita duplicar la calificación del mismo periodo
);

-- =====================================================================================
-- 7. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS)
-- =====================================================================================
alter table public.Escuela ENABLE row LEVEL SECURITY;

alter table public.Usuario ENABLE row LEVEL SECURITY;

alter table public.Administrador ENABLE row LEVEL SECURITY;

alter table public.Docente ENABLE row LEVEL SECURITY;

alter table public.CicloEscolar ENABLE row LEVEL SECURITY;

alter table public.Grado ENABLE row LEVEL SECURITY;

alter table public.Grupo ENABLE row LEVEL SECURITY;

alter table public.Materia ENABLE row LEVEL SECURITY;

alter table public.AsignacionAcademica ENABLE row LEVEL SECURITY;

alter table public.Alumno ENABLE row LEVEL SECURITY;

alter table public.ExpedienteAcademico ENABLE row LEVEL SECURITY;

alter table public.Tutor ENABLE row LEVEL SECURITY;

alter table public.AlumnoTutor ENABLE row LEVEL SECURITY;

alter table public.AlumnoGrupo ENABLE row LEVEL SECURITY;

alter table public.Calificacion ENABLE row LEVEL SECURITY;