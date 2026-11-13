import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CrearAsignacionAcademicaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cicloId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  grupoId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  materiaId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  docenteId!: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
