import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { AlumnosService } from './alumnos.service';
import { ActualizarAlumnoDto } from './dto/actualizar-alumno.dto';

@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.alumnosService.obtenerPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarAlumnoDto,
  ) {
    return this.alumnosService.actualizar(id, dto);
  }
}
