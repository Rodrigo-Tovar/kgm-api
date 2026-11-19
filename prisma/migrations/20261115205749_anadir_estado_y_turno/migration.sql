-- DropIndex
DROP INDEX "tutor_curp_key";

-- AlterTable
ALTER TABLE "cicloescolar" ADD COLUMN     "estado" VARCHAR(50) NOT NULL DEFAULT 'Programado';

-- AlterTable
ALTER TABLE "grupo" ADD COLUMN     "turno" VARCHAR(50);
