import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ListarAsignacionesAcademicasQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cicloId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  grupoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materiaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  docenteId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') return value;
    const normalizado = String(value).toLowerCase();
    if (normalizado === 'true' || normalizado === '1') return true;
    if (normalizado === 'false' || normalizado === '0') return false;
    return value;
  })
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(150)
  busqueda?: string;
}
