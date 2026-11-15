import { IsDateString, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearCicloEscolarDto {
  @IsNotEmpty({ message: 'El nombre del ciclo es obligatorio.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres.' })
  nombre!: string;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato de fecha válido (YYYY-MM-DD).' })
  fechaInicio!: string;

  @IsNotEmpty({ message: 'La fecha de fin es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de fin debe tener formato de fecha válido (YYYY-MM-DD).' })
  fechaFin!: string;
}