import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoSolicitud } from '../../../core/enums/estados.enum';

export class UpdateEstadoSolicitudDto {
  @ApiProperty({
    description: 'Nuevo estado para la solicitud comercial',
    enum: EstadoSolicitud,
    example: EstadoSolicitud.EN_GESTION,
  })
  @IsNotEmpty({ message: 'El campo estado es obligatorio' })
  @IsEnum(EstadoSolicitud, {
    message: 'El estado debe ser PENDIENTE, EN_GESTION o RESUELTA',
  })
  estado: EstadoSolicitud;
}
