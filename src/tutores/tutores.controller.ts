import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CrearTutorDto } from './dto/crear-tutor.dto';
import { TutoresService } from './tutores.service';

@Controller('tutores')
export class TutoresController {
  constructor(private readonly tutoresService: TutoresService) {}

  @Get()
  listar(
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
    @Query('search') search?: string,
  ) {
    return this.tutoresService.listar(escuelaId, search);
  }

  @Get(':id')
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @Query('escuelaId', ParseIntPipe) escuelaId: number,
  ) {
    return this.tutoresService.obtenerPorId(id, escuelaId);
  }

  @Post()
  crear(@Body() dto: CrearTutorDto) {
    return this.tutoresService.crear(dto);
  }
}
