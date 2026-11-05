-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "administrador" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "usuarioid" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administrador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumno" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "matricula" VARCHAR(50) NOT NULL,
    "curp" VARCHAR(18) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellidopaterno" VARCHAR(100) NOT NULL,
    "apellidomaterno" VARCHAR(100),
    "fechanacimiento" DATE NOT NULL,
    "nacionalidad" VARCHAR(50),
    "genero" VARCHAR(50),
    "direccion" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumnogrupo" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "alumnoid" INTEGER NOT NULL,
    "grupoid" INTEGER NOT NULL,
    "cicloid" INTEGER NOT NULL,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumnogrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumnotutor" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "alumnoid" INTEGER NOT NULL,
    "tutorid" INTEGER NOT NULL,
    "es_principal" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumnotutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignacionacademica" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "cicloid" INTEGER NOT NULL,
    "grupoid" INTEGER NOT NULL,
    "materiaid" INTEGER NOT NULL,
    "docenteid" INTEGER NOT NULL,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignacionacademica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificacion" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "asignacionacademicaid" INTEGER NOT NULL,
    "alumnoid" INTEGER NOT NULL,
    "periodo" VARCHAR(50) NOT NULL,
    "valor" DECIMAL(4,2) NOT NULL,
    "fecharegistro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cicloescolar" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "fechainicio" DATE NOT NULL,
    "fechafin" DATE NOT NULL,
    "nombre" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cicloescolar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docente" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "usuarioid" INTEGER,
    "curp" VARCHAR(18) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellidopaterno" VARCHAR(100) NOT NULL,
    "apellidomaterno" VARCHAR(100),
    "estado" VARCHAR(50) NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "docente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escuela" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escuela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedienteacademico" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "alumnoid" INTEGER NOT NULL,
    "rutaarchivopdf" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expedienteacademico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grado" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "gradoid" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materia" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "gradoid" INTEGER NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "usuarioid" INTEGER,
    "curp" VARCHAR(18),
    "nombre" VARCHAR(100) NOT NULL,
    "apellidopaterno" VARCHAR(100) NOT NULL,
    "apellidomaterno" VARCHAR(100),
    "parentesco" VARCHAR(50) NOT NULL,
    "correo" VARCHAR(255),
    "telefono" VARCHAR(50),
    "direccion" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "escuelaid" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "administrador_usuarioid_key" ON "administrador"("usuarioid");

-- CreateIndex
CREATE UNIQUE INDEX "alumno_matricula_key" ON "alumno"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "alumno_curp_key" ON "alumno"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "alumnogrupo_alumnoid_cicloid_key" ON "alumnogrupo"("alumnoid", "cicloid");

-- CreateIndex
CREATE UNIQUE INDEX "alumnotutor_alumnoid_tutorid_key" ON "alumnotutor"("alumnoid", "tutorid");

-- CreateIndex
CREATE UNIQUE INDEX "calificacion_asignacionacademicaid_alumnoid_periodo_key" ON "calificacion"("asignacionacademicaid", "alumnoid", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "docente_usuarioid_key" ON "docente"("usuarioid");

-- CreateIndex
CREATE UNIQUE INDEX "docente_curp_key" ON "docente"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "expedienteacademico_alumnoid_key" ON "expedienteacademico"("alumnoid");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_usuarioid_key" ON "tutor"("usuarioid");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_curp_key" ON "tutor"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- AddForeignKey
ALTER TABLE "administrador" ADD CONSTRAINT "administrador_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "administrador" ADD CONSTRAINT "administrador_usuarioid_fkey" FOREIGN KEY ("usuarioid") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumno" ADD CONSTRAINT "alumno_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumnogrupo" ADD CONSTRAINT "alumnogrupo_alumnoid_fkey" FOREIGN KEY ("alumnoid") REFERENCES "alumno"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumnogrupo" ADD CONSTRAINT "alumnogrupo_cicloid_fkey" FOREIGN KEY ("cicloid") REFERENCES "cicloescolar"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumnogrupo" ADD CONSTRAINT "alumnogrupo_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumnogrupo" ADD CONSTRAINT "alumnogrupo_grupoid_fkey" FOREIGN KEY ("grupoid") REFERENCES "grupo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumnotutor" ADD CONSTRAINT "alumnotutor_alumnoid_fkey" FOREIGN KEY ("alumnoid") REFERENCES "alumno"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumnotutor" ADD CONSTRAINT "alumnotutor_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumnotutor" ADD CONSTRAINT "alumnotutor_tutorid_fkey" FOREIGN KEY ("tutorid") REFERENCES "tutor"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asignacionacademica" ADD CONSTRAINT "asignacionacademica_cicloid_fkey" FOREIGN KEY ("cicloid") REFERENCES "cicloescolar"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asignacionacademica" ADD CONSTRAINT "asignacionacademica_docenteid_fkey" FOREIGN KEY ("docenteid") REFERENCES "docente"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asignacionacademica" ADD CONSTRAINT "asignacionacademica_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asignacionacademica" ADD CONSTRAINT "asignacionacademica_grupoid_fkey" FOREIGN KEY ("grupoid") REFERENCES "grupo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asignacionacademica" ADD CONSTRAINT "asignacionacademica_materiaid_fkey" FOREIGN KEY ("materiaid") REFERENCES "materia"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_alumnoid_fkey" FOREIGN KEY ("alumnoid") REFERENCES "alumno"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_asignacionacademicaid_fkey" FOREIGN KEY ("asignacionacademicaid") REFERENCES "asignacionacademica"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cicloescolar" ADD CONSTRAINT "cicloescolar_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docente" ADD CONSTRAINT "docente_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docente" ADD CONSTRAINT "docente_usuarioid_fkey" FOREIGN KEY ("usuarioid") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expedienteacademico" ADD CONSTRAINT "expedienteacademico_alumnoid_fkey" FOREIGN KEY ("alumnoid") REFERENCES "alumno"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expedienteacademico" ADD CONSTRAINT "expedienteacademico_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "grado" ADD CONSTRAINT "grado_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_gradoid_fkey" FOREIGN KEY ("gradoid") REFERENCES "grado"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materia" ADD CONSTRAINT "materia_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materia" ADD CONSTRAINT "materia_gradoid_fkey" FOREIGN KEY ("gradoid") REFERENCES "grado"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tutor" ADD CONSTRAINT "tutor_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tutor" ADD CONSTRAINT "tutor_usuarioid_fkey" FOREIGN KEY ("usuarioid") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_escuelaid_fkey" FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
