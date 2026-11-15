import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GradosGruposService } from './grados-grupos.service';
import { CrearGradoDto } from './dto/crear-grado.dto';
import { CrearGrupoDto } from './dto/crear-grupo.dto';

@Controller('escuelas/:escuelaId/grados-grupos')
export class GradosGruposController {
  constructor(private readonly gradosGruposService: GradosGruposService) {}

  @Get('grados')
  async listarGrados(@Param('escuelaId', ParseIntPipe) escuelaId: number) {
    return this.gradosGruposService.listarGrados(escuelaId);
  }

  @Post('grados')
  async crearGrado(
    @Param('escuelaId', ParseIntPipe) escuelaId: number,
    @Body() dto: CrearGradoDto,
  ) {
    return this.gradosGruposService.crearGrado(escuelaId, dto);
  }

  @Get('grupos')
  async listarGrupos(
    @Param('escuelaId', ParseIntPipe) escuelaId: number,
    @Query('gradoId', ParseIntPipe) gradoId: number,
    @Query('cicloId') cicloId?: string,
  ) {
    return this.gradosGruposService.listarGruposPorGrado(
      escuelaId,
      gradoId,
      cicloId ? Number(cicloId) : undefined,
    );
  }

  @Post('grupos')
  async crearGrupo(
    @Param('escuelaId', ParseIntPipe) escuelaId: number,
    @Body() dto: CrearGrupoDto,
  ) {
    return this.gradosGruposService.crearGrupo(escuelaId, dto);
  }
}