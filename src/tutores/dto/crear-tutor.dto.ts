import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearTutorDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  alumnoId?: number;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'El apellido paterno es obligatorio.' })
  @MaxLength(100)
  apellidoPaterno!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(100)
  apellidoMaterno?: string;

  @IsString()
  @Matches(/^[a-z0-9]{18}$/i, {
    message: 'El CURP debe tener exactamente 18 caracteres alfanuméricos.',
  })
  curp!: string;

  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe contener 10 dígitos numéricos.',
  })
  telefono!: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'El parentesco es obligatorio.' })
  @MaxLength(50)
  parentesco!: string;

  @IsString()
  @IsOptional()
  direccion?: string;
}
