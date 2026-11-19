import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { CiclosEscolaresService } from './ciclos-escolares.service';
import { CrearCicloEscolarDto } from './dto/crear-ciclo-escolar.dto';
import { ActualizarEstadoCicloDto } from './dto/actualizar-ciclo-escolar.dto';

@Controller('escuelas/:escuelaId/ciclos-escolares')
export class CiclosEscolaresController {
    constructor(private readonly ciclosService: CiclosEscolaresService) { }

    @Get()
    async listar(
        @Param('escuelaId', ParseIntPipe) escuelaId: number,
        @Query('pagina') pagina?: number,
        @Query('limite') limite?: number,
        @Query('estado') estado?: string,
    ) {
        return this.ciclosService.listarPaginado(
            escuelaId,
            Number(pagina) || 1,
            Number(limite) || 10,
            estado,
        );
    }

    @Post()
    async crear(
        @Param('escuelaId', ParseIntPipe) escuelaId: number,
        @Body() dto: CrearCicloEscolarDto,
    ) {
        return this.ciclosService.crear(escuelaId, dto);
    }

    @Patch(':cicloId/estado')
    async cambiarEstado(
        @Param('escuelaId', ParseIntPipe) escuelaId: number,
        @Param('cicloId', ParseIntPipe) cicloId: number,
        @Body() dto: ActualizarEstadoCicloDto,
    ) {
        return this.ciclosService.cambiarEstado(escuelaId, cicloId, dto.estado);
    }
}