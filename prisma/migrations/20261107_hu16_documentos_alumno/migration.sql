CREATE TABLE "documentoalumno" (
	"id" SERIAL NOT NULL,
	"escuelaid" INTEGER NOT NULL,
	"alumnoid" INTEGER NOT NULL,
	"tipo" VARCHAR(50) NOT NULL,
	"nombrearchivo" VARCHAR(255) NOT NULL,
	"contenido" BYTEA NOT NULL,
	"mimetype" VARCHAR(100) NOT NULL,
	"tamanobytes" INTEGER NOT NULL,
	"created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT "documentoalumno_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "documentoalumno" ADD CONSTRAINT "documentoalumno_escuelaid_fkey"
	FOREIGN KEY ("escuelaid") REFERENCES "escuela"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "documentoalumno" ADD CONSTRAINT "documentoalumno_alumnoid_fkey"
	FOREIGN KEY ("alumnoid") REFERENCES "alumno"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
