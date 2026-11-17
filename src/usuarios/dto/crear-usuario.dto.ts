import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const ROLES_REGISTRABLES = ['ADMINISTRADOR', 'DOCENTE', 'TUTOR'] as const;

export class CrearUsuarioDto {
  @IsIn(ROLES_REGISTRABLES)
  rol!: (typeof ROLES_REGISTRABLES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perfilId?: number;

  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;
}

export class OpcionesUsuarioDto {
  @IsIn(['DOCENTE', 'TUTOR'])
  rol!: 'DOCENTE' | 'TUTOR';
}
