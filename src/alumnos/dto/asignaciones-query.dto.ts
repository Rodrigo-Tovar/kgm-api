import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AsignacionesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId!: number;
}
