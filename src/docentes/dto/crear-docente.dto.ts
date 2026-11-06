import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearDocenteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId!: number;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(100)
  apellidoPaterno!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellidoMaterno?: string;

  @IsString()
  @Matches(/^[a-z0-9]{18}$/i)
  curp!: string;

  @IsDateString()
  fechaNacimiento!: string;

  @IsIn(['ACTIVO', 'INACTIVO'])
  estado!: 'ACTIVO' | 'INACTIVO';

  @IsString()
  @Matches(/^\d{10}$/)
  telefono!: string;

  @IsEmail()
  @MaxLength(255)
  correo!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(250)
  direccion!: string;
}
