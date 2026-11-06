import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ListarMateriasQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gradoId?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(150)
  busqueda?: string;
}
