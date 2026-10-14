import { ApiProperty } from '@nestjs/swagger';
import { SolicitudResponseDto } from './solicitud-response.dto';
import { Solicitud } from '../entities/solicitud.entity';

export class PaginatedSolicitudesDto {
  @ApiProperty({ type: [SolicitudResponseDto] })
  items: Solicitud[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

