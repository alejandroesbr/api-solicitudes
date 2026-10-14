import { ApiProperty } from '@nestjs/swagger';
import { TipoEventoHistorial } from '../../../core/enums/tipo-evento-historial.enum';

export class SolicitudHistorialResponseDto {
  @ApiProperty({ example: 1, description: 'Identificador único del evento' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID de la solicitud relacionada' })
  solicitudId: number;

  @ApiProperty({
    enum: TipoEventoHistorial,
    example: TipoEventoHistorial.CREACION,
    description: 'Tipo de evento registrado (CREACION, ESTADO, ASIGNACION)',
  })
  tipoEvento: TipoEventoHistorial;

  @ApiProperty({
    example: 'PENDIENTE',
    nullable: true,
    description: 'Valor anterior al cambio (null en creación)',
  })
  valorAnterior: string | null;

  @ApiProperty({
    example: 'EN_GESTION',
    description: 'Nuevo valor aplicado tras el evento',
  })
  valorNuevo: string;

  @ApiProperty({
    example: 'supervisor',
    description: 'Usuario que ejecutó la acción (actor)',
  })
  usuarioActor: string;

  @ApiProperty({
    example: '2026-10-13T18:30:00.000Z',
    description: 'Fecha y hora en que ocurrió el evento',
  })
  fechaEvento: Date;
}

