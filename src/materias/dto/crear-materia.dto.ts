import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearMateriaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  gradoId!: number;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;
}
