import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/current-user.decorator';
import type { UsuarioAutenticado } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CrearUsuarioDto, OpcionesUsuarioDto } from './dto/crear-usuario.dto';
import { opcionesFotoAdministrador } from './usuarios.storage';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('opciones')
  opciones(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Query() query: OpcionesUsuarioDto,
  ) {
    return this.usuariosService.listarOpciones(usuario.escuelaId, query.rol);
  }

  @Post()
  @UseInterceptors(FileInterceptor('foto', opcionesFotoAdministrador))
  crear(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: CrearUsuarioDto,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    return this.usuariosService.crear(usuario, dto, foto);
  }
}
