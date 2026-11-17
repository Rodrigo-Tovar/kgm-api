import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BootstrapAdminDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  escuelaId!: number;

  @IsString()
  @MaxLength(255)
  nombre!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}
