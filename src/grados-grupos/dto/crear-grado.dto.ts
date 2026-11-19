import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearGradoDto {
  @IsNotEmpty({ message: 'El nombre del grado es obligatorio.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MaxLength(50, { message: 'El nombre del grado no puede exceder los 50 caracteres.' })
  nombre!: string;
}