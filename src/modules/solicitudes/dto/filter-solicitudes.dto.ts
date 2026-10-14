import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EstadoSolicitud } from '../../../core/enums/estados.enum';

export class FilterSolicitudesDto {
  @ApiPropertyOptional({
    description: 'Filtra por estado de la solicitud',
    enum: EstadoSolicitud,
    example: EstadoSolicitud.PENDIENTE,
  })
  @IsOptional()
  @IsEnum(EstadoSolicitud, {
    message: 'El estado debe ser PENDIENTE, EN_GESTION o RESUELTA',
  })
  estado?: EstadoSolicitud;

  @ApiPropertyOptional({
    description:
      'Filtra por identificador del asesor asignado. Ignorado para asesores (solo ven las suyas).',
    example: 'asesor1',
  })
  @IsOptional()
  @IsString({ message: 'El parámetro asesor debe ser una cadena de texto' })
  asesor?: string;

  @ApiPropertyOptional({
    description: 'Búsqueda parcial de cliente insensible a mayúsculas y minúsculas',
    example: 'acme',
  })
  @IsOptional()
  @IsString({ message: 'El parámetro cliente debe ser una cadena de texto' })
  cliente?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del intervalo (formato ISO 8601)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601(
    {},
    { message: 'El parámetro desde debe tener un formato ISO 8601 válido' },
  )
  desde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del intervalo (formato ISO 8601)',
    example: '2026-10-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601(
    {},
    { message: 'El parámetro hasta debe tener un formato ISO 8601 válido' },
  )
  hasta?: string;

  @ApiPropertyOptional({
    description: 'Número de página a consultar (predeterminado 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El parámetro page debe ser un número entero' })
  @Min(1, { message: 'El parámetro page no puede ser cero ni negativo' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página (predeterminado 10, máximo 100)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El parámetro limit debe ser un número entero' })
  @Min(1, { message: 'El parámetro limit no puede ser cero ni negativo' })
  @Max(100, { message: 'El parámetro limit no puede superar 100' })
  limit: number = 10;
}

