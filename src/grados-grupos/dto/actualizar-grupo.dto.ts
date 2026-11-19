import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ActualizarGrupoDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MaxLength(50, { message: 'El nombre del grupo no puede exceder los 50 caracteres.' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El turno debe ser una cadena de texto.' })
  @MaxLength(50, { message: 'El turno no puede exceder los 50 caracteres.' })
  turno?: string;

  @IsOptional()
  @IsInt({ message: 'La capacidad debe ser un número entero.' })
  @Min(1, { message: 'La capacidad mínima debe ser de al menos 1 alumno.' })
  capacidad?: number;
}