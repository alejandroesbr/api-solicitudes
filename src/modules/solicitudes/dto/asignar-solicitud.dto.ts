import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AsignarSolicitudDto {
  @ApiProperty({
    description: 'Username del asesor asignado (debe existir y tener rol asesor)',
    example: 'asesor1',
    maxLength: 255,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({
    message: 'El campo asesor es obligatorio y no puede estar vacío',
  })
  @IsString({ message: 'El campo asesor debe ser una cadena de texto' })
  @MaxLength(255, {
    message: 'El campo asesor no debe exceder los 255 caracteres',
  })
  asesor: string;
}

