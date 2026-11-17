import {
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  iniciarSesion(@Body() dto: LoginDto) {
    return this.authService.iniciarSesion(dto);
  }

  @Post('bootstrap-admin')
  bootstrapAdmin(
    @Body() dto: BootstrapAdminDto,
    @Headers('x-admin-bootstrap-secret') secret?: string,
  ) {
    return this.authService.crearAdministradorInicial(dto, secret);
  }
}
