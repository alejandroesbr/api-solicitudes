import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSolicitudDto {
  @ApiProperty({
    description: 'Nombre o razón social del cliente',
    example: 'Acme Corp',
    maxLength: 255,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({
    message: 'El campo cliente es obligatorio y no puede estar vacío',
  })
  @IsString({ message: 'El campo cliente debe ser una cadena de texto' })
  @MaxLength(255, {
    message: 'El campo cliente no debe exceder los 255 caracteres',
  })
  cliente: string;

  @ApiProperty({
    description: 'Detalle o descripción de la solicitud comercial',
    example: 'Contacto inicial para cotización de plan corporativo anual',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({
    message: 'El campo descripcion es obligatorio y no puede estar vacío',
  })
  @IsString({ message: 'El campo descripcion debe ser una cadena de texto' })
  descripcion: string;

  @ApiPropertyOptional({
    description:
      'Username del asesor a quien se asigna la solicitud. Obligatorio si el solicitante es admin o supervisor. Ignorado si el solicitante es asesor.',
    example: 'asesor1',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El campo asesor debe ser una cadena de texto' })
  asesor?: string;
}
