import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActualizarDocenteDto } from './dto/actualizar-docente.dto';
import { CrearDocenteDto } from './dto/crear-docente.dto';
import { DocentesService } from './docentes.service';
import { opcionesFotoDocente } from './docentes.storage';

@Controller('docentes')
export class DocentesController {
  constructor(private readonly docentesService: DocentesService) {}

  @Get()
  listar(@Query('escuelaId', ParseIntPipe) escuelaId: number) {
    return this.docentesService.listar(escuelaId);
  }

  @Get(':id')
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
  ) {
    return this.docentesService.obtenerPorId(id, escuelaId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('foto', opcionesFotoDocente))
  crear(
    @Body() dto: CrearDocenteDto,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    return this.docentesService.crear(dto, foto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('foto', opcionesFotoDocente))
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
    @Body() dto: ActualizarDocenteDto,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    return this.docentesService.actualizar(id, escuelaId, dto, foto);
  }
}
