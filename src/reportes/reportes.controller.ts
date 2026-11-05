import { Controller, Get, Query } from '@nestjs/common';
import { ReporteCalificacionesQueryDto } from './dto/reporte-calificaciones-query.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('calificaciones/opciones')
  obtenerOpciones(@Query('escuelaId') escuelaId?: string) {
    const id = escuelaId ? Number(escuelaId) : 1;
    return this.reportesService.obtenerOpciones(Number.isFinite(id) ? id : 1);
  }

  @Get('calificaciones')
  generarReporte(@Query() query: ReporteCalificacionesQueryDto) {
    return this.reportesService.generarReporte(query);
  }
}
