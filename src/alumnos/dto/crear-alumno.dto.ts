import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearAlumnoDto {
  @IsInt()
  @Min(1)
  escuelaId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  matricula: string;

  @IsString()
  @Length(18, 18)
  curp: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidoPaterno: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellidoMaterno?: string;

  @IsDateString()
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nacionalidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  genero?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  correo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  tutorId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  grupoId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cicloId?: number;
}