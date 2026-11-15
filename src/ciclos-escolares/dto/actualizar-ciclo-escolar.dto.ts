import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ActualizarEstadoCicloDto {
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsString()
  @IsIn(['Activo', 'Cerrado', 'Programado'], {
    message: 'El estado debe ser Activo, Cerrado o Programado.',
  })
  estado!: 'Activo' | 'Cerrado' | 'Programado';
}