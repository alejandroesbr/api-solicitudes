import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiEnvelopeResponse } from '../../../core/decorators/api-envelope-response.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { ErrorResponseDto } from '../../../core/dto/envelope-response.dto';
import { UserRole } from '../../../core/enums/roles.enum';
import { User } from '../../users/entities/user.entity';
import { CreateSolicitudDto } from '../dto/create-solicitud.dto';
import { SolicitudResponseDto } from '../dto/solicitud-response.dto';
import { UpdateEstadoSolicitudDto } from '../dto/update-estado-solicitud.dto';
import { Solicitud } from '../entities/solicitud.entity';
import { SolicitudesService } from '../services/solicitudes.service';

@ApiTags('Solicitudes Comerciales')
@ApiSecurity('x-api-key')
@ApiSecurity('x-user')
@ApiHeader({
  name: 'x-api-key',
  description: 'Clave de API configurada en el sistema',
  required: true,
})
@ApiHeader({
  name: 'x-user',
  description: 'Nombre de usuario autenticado (admin, supervisor, asesor1, asesor2)',
  required: true,
})
@ApiUnauthorizedResponse({
  description: 'Falta o es inválida la API key, o usuario no registrado',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'Rol no autorizado o acceso a recurso ajeno',
  type: ErrorResponseDto,
})
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ASESOR)
  @ApiOperation({
    summary: 'Registrar una nueva solicitud comercial',
    description:
      'Cualquier usuario puede registrar una solicitud con estado inicial PENDIENTE. Si es asesor, el campo asesor se autoasigna. Si es admin o supervisor, debe indicar un asesor válido.',
  })
  @ApiEnvelopeResponse(SolicitudResponseDto, {
    status: 201,
    description: 'Solicitud creada con éxito',
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o asesor no asignado correctamente',
    type: ErrorResponseDto,
  })
  async create(
    @Body() dto: CreateSolicitudDto,
    @CurrentUser() user: User,
  ): Promise<Solicitud> {
    return this.solicitudesService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ASESOR)
  @ApiOperation({
    summary: 'Consultar solicitudes según permisos del usuario',
    description:
      'Admin y supervisor obtienen todas las solicitudes. Asesor solo obtiene las asignadas a su propio usuario.',
  })
  @ApiEnvelopeResponse(SolicitudResponseDto, {
    isArray: true,
    description: 'Lista de solicitudes obtenida con éxito',
  })
  async findAll(@CurrentUser() user: User): Promise<Solicitud[]> {
    return this.solicitudesService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ASESOR)
  @ApiOperation({
    summary: 'Consultar una solicitud individual por ID',
    description:
      'Retorna los detalles de una solicitud. Si un asesor intenta consultar una solicitud ajena, se responde 403.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID autoincremental de la solicitud',
    example: 1,
  })
  @ApiEnvelopeResponse(SolicitudResponseDto, {
    description: 'Solicitud encontrada',
  })
  @ApiNotFoundResponse({
    description: 'Solicitud no encontrada',
    type: ErrorResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Solicitud> {
    return this.solicitudesService.findOne(id, user);
  }

  @Patch(':id/estado')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ASESOR)
  @ApiOperation({
    summary: 'Actualizar el estado de una solicitud comercial',
    description:
      'Transiciones permitidas: PENDIENTE -> EN_GESTION -> RESUELTA. Supervisor y admin pueden cambiar cualquiera; asesor solo las suyas. Transición inválida retorna 409.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la solicitud a modificar',
    example: 1,
  })
  @ApiEnvelopeResponse(SolicitudResponseDto, {
    description: 'Estado de la solicitud actualizado correctamente',
  })
  @ApiNotFoundResponse({
    description: 'Solicitud no encontrada',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Transición de estado inválida',
    type: ErrorResponseDto,
  })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoSolicitudDto,
    @CurrentUser() user: User,
  ): Promise<Solicitud> {
    return this.solicitudesService.updateEstado(id, dto, user);
  }
}
