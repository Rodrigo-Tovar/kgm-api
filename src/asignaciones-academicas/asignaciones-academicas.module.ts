import { Module } from '@nestjs/common';
import { AsignacionesAcademicasController } from './asignaciones-academicas.controller';
import { AsignacionesAcademicasService } from './asignaciones-academicas.service';

@Module({
  controllers: [AsignacionesAcademicasController],
  providers: [AsignacionesAcademicasService],
  exports: [AsignacionesAcademicasService],
})
export class AsignacionesAcademicasModule {}
