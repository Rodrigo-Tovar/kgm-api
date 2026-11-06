ALTER TABLE "materia" ADD COLUMN "clave" VARCHAR(50);

UPDATE "materia"
SET "clave" = 'MAT-' || LPAD("id"::text, 3, '0')
WHERE "clave" IS NULL;

ALTER TABLE "materia" ALTER COLUMN "clave" SET NOT NULL;

CREATE UNIQUE INDEX "materia_escuelaid_clave_key"
  ON "materia" ("escuelaid", "clave");
