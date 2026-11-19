import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { TIPOS_DOCUMENTO } from '../documentos.constants';

export class CrearDocumentoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  alumnoId!: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(TIPOS_DOCUMENTO)
  tipo!: string;
}
