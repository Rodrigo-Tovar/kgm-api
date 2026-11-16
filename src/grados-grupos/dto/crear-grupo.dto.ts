import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearGrupoDto {
  @IsNotEmpty({ message: 'El ID del grado es obligatorio' })
  @IsInt()
  @IsPositive()
  gradoId!: number;

  @IsNotEmpty({ message: 'El nombre del grupo es obligatorio' })
  @IsString()
  @MaxLength(50)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  turno?: string;
}