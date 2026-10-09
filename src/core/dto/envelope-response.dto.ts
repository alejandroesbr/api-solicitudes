import { ApiProperty } from '@nestjs/swagger';

export class EnvelopeResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: '/solicitudes' })
  path: string;

  @ApiProperty({ example: '2026-10-09T15:00:00.000Z' })
  timestamp: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Datos inválidos' })
  message: string | string[];

  @ApiProperty({ example: '/solicitudes' })
  path: string;

  @ApiProperty({ example: '2026-10-09T15:00:00.000Z' })
  timestamp: string;
}
