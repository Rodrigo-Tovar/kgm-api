import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class ActualizarAsignacionAcademicaDto {
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
  @IsBoolean()
  activo?: boolean;
}
