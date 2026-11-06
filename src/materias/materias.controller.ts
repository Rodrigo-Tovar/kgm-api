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
import { ActualizarMateriaDto } from './dto/actualizar-materia.dto';
import { CrearMateriaDto } from './dto/crear-materia.dto';
import { ListarMateriasQueryDto } from './dto/listar-materias-query.dto';
import { MateriasService } from './materias.service';

@Controller('materias')
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) {}

  @Get()
  listar(@Query() query: ListarMateriasQueryDto) {
    return this.materiasService.listar(query);
  }

  @Get(':id')
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
  ) {
    return this.materiasService.obtenerPorId(id, escuelaId);
  }

  @Post()
  crear(@Body() dto: CrearMateriaDto) {
    return this.materiasService.crear(dto);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
    @Body() dto: ActualizarMateriaDto,
  ) {
    return this.materiasService.actualizar(id, escuelaId, dto);
  }

  @Delete(':id')
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
  ) {
    return this.materiasService.eliminar(id, escuelaId);
  }
}
