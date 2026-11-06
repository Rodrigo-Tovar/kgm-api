import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearAsignacionAlumnoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cicloId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  grupoId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
