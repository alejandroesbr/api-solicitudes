import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoSolicitud } from '../../../core/enums/estados.enum';
import { UserRole } from '../../../core/enums/roles.enum';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { AsignarSolicitudDto } from '../dto/asignar-solicitud.dto';
import { CreateSolicitudDto } from '../dto/create-solicitud.dto';
import { UpdateEstadoSolicitudDto } from '../dto/update-estado-solicitud.dto';
import { Solicitud } from '../entities/solicitud.entity';
import { SolicitudHistorial } from '../entities/solicitud-historial.entity';
import { SolicitudesRepository } from '../repositories/solicitudes.repository';
import { isValidTransition } from './solicitud-transitions';

@Injectable()
export class SolicitudesService {
  constructor(
    private readonly solicitudesRepository: SolicitudesRepository,
    private readonly usersService: UsersService,
  ) {}

  /**
   * RN-01 y RN-07: Registrar solicitudes comerciales.
   * - Si es asesor: se fija automáticamente su propio username.
   * - Si es supervisor o admin: queda sin asignación (null) hasta asignación explícita.
   * - RN-09: Registra evento CREACION en el historial dentro de la transacción.
   */
  async create(dto: CreateSolicitudDto, user: User): Promise<Solicitud> {
    const assignedAsesor = user.role === UserRole.ASESOR ? user.username : null;

    return this.solicitudesRepository.createAndSave(
      {
        cliente: dto.cliente,
        descripcion: dto.descripcion,
        asesor: assignedAsesor,
      },
      user.username,
    );
  }

  /**
   * RN-07: Asignación o reasignación de solicitudes comerciales.
   * - Solo admin y supervisor pueden asignar/reasignar.
   * - El usuario asignado debe existir y tener rol asesor.
   * - Si la solicitud está en estado RESUELTA, rechazar con conflicto (409).
   * - Reasignar no cambia automáticamente su estado.
   * - Registra evento ASIGNACION en el historial dentro de la transacción.
   */
  async asignar(
    id: number,
    dto: AsignarSolicitudDto,
    user: User,
  ): Promise<Solicitud> {
    const solicitud = await this.solicitudesRepository.findById(id);
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    if (solicitud.estado === EstadoSolicitud.RESUELTA) {
      throw new ConflictException(
        'Una solicitud en estado RESUELTA no puede reasignarse',
      );
    }

    const targetUser = await this.usersService.findByUsername(dto.asesor);
    if (!targetUser || targetUser.role !== UserRole.ASESOR) {
      throw new BadRequestException(
        `El usuario asignado '${dto.asesor}' debe existir en el catálogo y tener el rol asesor`,
      );
    }

    return this.solicitudesRepository.assign(
      id,
      targetUser.username,
      user.username,
    );
  }

  /**
   * RN-02: Consulta de solicitudes.
   * - admin y supervisor consultan todas.
   * - asesor solo consulta las suyas (filtro aplicado en el where de la base de datos).
   */
  async findAll(user: User): Promise<Solicitud[]> {
    if (user.role === UserRole.ASESOR) {
      return this.solicitudesRepository.findAll({ asesor: user.username });
    }
    return this.solicitudesRepository.findAll();
  }

  /**
   * RN-02: Consulta individual de una solicitud.
   * - Si no existe: 404.
   * - Si es asesor y pertenece a otro: 403.
   */
  async findOne(id: number, user: User): Promise<Solicitud> {
    const solicitud = await this.solicitudesRepository.findById(id);
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    if (user.role === UserRole.ASESOR && solicitud.asesor !== user.username) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a esta solicitud',
      );
    }

    return solicitud;
  }

  /**
   * RN-03 y RN-09: Cambio de estado de la solicitud.
   * Orden estricto de comprobación:
   * 1. Existencia -> 404
   * 2. Propiedad -> 403 si asesor ajeno
   * 3. Transición de estado -> 409 si inválida
   * 4. Registra evento ESTADO en el historial dentro de la transacción.
   */
  async updateEstado(
    id: number,
    dto: UpdateEstadoSolicitudDto,
    user: User,
  ): Promise<Solicitud> {
    const solicitud = await this.solicitudesRepository.findById(id);
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    if (user.role === UserRole.ASESOR && solicitud.asesor !== user.username) {
      throw new ForbiddenException(
        'No tiene permisos para cambiar el estado de una solicitud ajena',
      );
    }

    if (!isValidTransition(solicitud.estado, dto.estado)) {
      throw new ConflictException(
        `Transición de estado no permitida de '${solicitud.estado}' a '${dto.estado}'`,
      );
    }

    return this.solicitudesRepository.updateEstado(
      id,
      dto.estado,
      user.username,
    );
  }

  /**
   * RN-09: Consulta de historial de auditoría de una solicitud.
   * - Si no existe: 404.
   * - Solo admin y supervisor pueden consultar de cualquier solicitud.
   * - Asesor solo puede consultar de solicitudes que tiene asignadas actualmente.
   */
  async findHistorial(
    id: number,
    user: User,
  ): Promise<SolicitudHistorial[]> {
    const solicitud = await this.solicitudesRepository.findById(id);
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    if (user.role === UserRole.ASESOR && solicitud.asesor !== user.username) {
      throw new ForbiddenException(
        'No tiene permisos para consultar el historial de esta solicitud',
      );
    }

    return this.solicitudesRepository.findHistorialBySolicitudId(id);
  }
}
