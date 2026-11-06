import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AsignacionesQueryDto } from './dto/asignaciones-query.dto';
import { CrearAsignacionAlumnoDto } from './dto/crear-asignacion-alumno.dto';
import { AlumnosService } from './alumnos.service';

@Controller('alumnos/asignaciones')
export class AsignacionesController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get()
  listar(@Query() query: AsignacionesQueryDto) {
    return this.alumnosService.listarAsignaciones(query.escuelaId);
  }

  @Get('opciones')
  obtenerOpciones(@Query() query: AsignacionesQueryDto) {
    return this.alumnosService.obtenerOpcionesAsignacion(query.escuelaId);
  }

  @Post(':alumnoId')
  crear(
    @Query() query: AsignacionesQueryDto,
    @Body() dto: CrearAsignacionAlumnoDto,
    @Param('alumnoId', ParseIntPipe) alumnoId: number,
  ) {
    return this.alumnosService.crearAsignacion(
      alumnoId,
      query.escuelaId,
      dto,
    );
  }
}
