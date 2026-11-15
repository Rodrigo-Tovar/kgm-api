import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CiclosEscolaresService } from './ciclos-escolares.service';
import { CrearCicloEscolarDto } from './dto/crear-ciclo-escolar.dto';

@Controller('escuelas/:escuelaId/ciclos-escolares')
export class CiclosEscolaresController {
  constructor(private readonly ciclosService: CiclosEscolaresService) {}

  @Get()
  async listar(
    @Param('escuelaId', ParseIntPipe) escuelaId: number,
    @Query('estado') estado?: string,
  ) {
    return this.ciclosService.listar(escuelaId, estado);
  }

  @Post()
  async crear(
    @Param('escuelaId', ParseIntPipe) escuelaId: number,
    @Body() dto: CrearCicloEscolarDto,
  ) {
    return this.ciclosService.crear(escuelaId, dto);
  }
}