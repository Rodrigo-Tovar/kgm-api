import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ActualizarAlumnoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]*$/, {
    message: 'El nombre contiene caracteres no válidos.',
  })
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]*$/, {
    message: 'El apellido paterno contiene caracteres no válidos.',
  })
  @MaxLength(100)
  apellidoPaterno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellidoMaterno?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]*$/, {
    message: 'La nacionalidad contiene caracteres no válidos.',
  })
  @MaxLength(50)
  nacionalidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  genero?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe contener 10 dígitos.',
  })
  @MaxLength(10)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  correo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['Matutino', 'Vespertino'])
  turno?: string;

  @IsOptional()
  @IsDateString()
  fechaIngreso?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
