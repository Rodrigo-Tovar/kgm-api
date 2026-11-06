import { Module } from '@nestjs/common';
import { AlumnosController } from './alumnos.controller';
import { AsignacionesController } from './asignaciones.controller';
import { AlumnosService } from './alumnos.service';

@Module({
  controllers: [AsignacionesController, AlumnosController],
  providers: [AlumnosService],
  exports: [AlumnosService],
})
export class AlumnosModule {}
