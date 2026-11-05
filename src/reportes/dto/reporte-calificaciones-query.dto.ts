import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ReporteCalificacionesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cicloId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  gradoId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  grupoId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materiaId?: number;

  @IsString()
  periodo!: string;
}
