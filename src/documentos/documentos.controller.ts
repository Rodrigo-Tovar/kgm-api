import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CrearDocumentoDto } from './dto/crear-documento.dto';
import { DocumentosService } from './documentos.service';
import { opcionesDocumento, validarFirmaDocumento } from './documentos.storage';
import { DocumentoMulterFilter } from './documentos.filter';

@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get()
  listar(@Query('alumnoId', ParseIntPipe) alumnoId: number, @Query('escuelaId', ParseIntPipe) escuelaId: number) {
    return this.documentosService.listarPorAlumno(alumnoId, escuelaId);
  }

  @Post()
  @UseFilters(DocumentoMulterFilter)
  @UseInterceptors(FileInterceptor('archivo', opcionesDocumento))
  async crear(
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Body() dto: CrearDocumentoDto,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
  ) {
    if (!archivo) throw new BadRequestException('Debe adjuntar un archivo.');
    validarFirmaDocumento(archivo);
    return this.documentosService.crear(dto, escuelaId, archivo);
  }

  @Get(':id/contenido')
  async contenido(@Param('id', ParseIntPipe) id: number, @Query('escuelaId', ParseIntPipe) escuelaId: number, @Res() response: Response) {
    const documento = await this.documentosService.obtenerContenido(id, escuelaId);
    response.set({ 'Content-Type': documento.mimeType, 'Content-Disposition': `inline; filename="${documento.nombreArchivo}"` });
    response.send(documento.contenido);
  }
}
