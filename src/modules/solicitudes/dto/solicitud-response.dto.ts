import { ApiProperty } from '@nestjs/swagger';
import { EstadoSolicitud } from '../../../core/enums/estados.enum';

export class SolicitudResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Acme Corp' })
  cliente: string;

  @ApiProperty({
    example: 'Contacto inicial para cotización de plan corporativo anual',
  })
  descripcion: string;

  @ApiProperty({ example: 'asesor1', nullable: true })
  asesor: string | null;

  @ApiProperty({ enum: EstadoSolicitud, example: EstadoSolicitud.PENDIENTE })
  estado: EstadoSolicitud;

  @ApiProperty({ example: '2026-10-09T14:30:00.000Z' })
  creada_en: Date;

  @ApiProperty({ example: '2026-10-09T14:30:00.000Z' })
  actualizada_en: Date;
}
