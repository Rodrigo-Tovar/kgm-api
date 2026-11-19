import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AsignacionesAcademicasService } from './asignaciones-academicas.service';
import { ActualizarAsignacionAcademicaDto } from './dto/actualizar-asignacion-academica.dto';
import { CrearAsignacionAcademicaDto } from './dto/crear-asignacion-academica.dto';
import { ListarAsignacionesAcademicasQueryDto } from './dto/listar-asignaciones-academicas-query.dto';

@Controller('asignaciones-academicas')
export class AsignacionesAcademicasController {
  constructor(
    private readonly asignacionesAcademicasService: AsignacionesAcademicasService,
  ) {}

  @Get()
  listar(@Query() query: ListarAsignacionesAcademicasQueryDto) {
    return this.asignacionesAcademicasService.listar(query);
  }

  @Get('opciones')
  obtenerOpciones(@Query('escuelaId', ParseIntPipe) escuelaId: number) {
    return this.asignacionesAcademicasService.obtenerOpciones(escuelaId);
  }

  @Get(':id')
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
  ) {
    return this.asignacionesAcademicasService.obtenerPorId(id, escuelaId);
  }

  @Post()
  crear(@Body() dto: CrearAsignacionAcademicaDto) {
    return this.asignacionesAcademicasService.crear(dto);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
    @Body() dto: ActualizarAsignacionAcademicaDto,
  ) {
    return this.asignacionesAcademicasService.actualizar(id, escuelaId, dto);
  }

  @Delete(':id')
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
  ) {
    return this.asignacionesAcademicasService.eliminar(id, escuelaId);
  }
}
