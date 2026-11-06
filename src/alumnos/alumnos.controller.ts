import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AlumnosService } from './alumnos.service';
import { ActualizarAlumnoDto } from './dto/actualizar-alumno.dto';
import { CrearAlumnoDto } from './dto/crear-alumno.dto';

@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get()
  listar(@Query('escuelaId', ParseIntPipe) escuelaId: number) {
    return this.alumnosService.listar(escuelaId);
  }
  @Post()
  crear(@Body() dto: CrearAlumnoDto) {
    return this.alumnosService.crear(dto);
  }
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
