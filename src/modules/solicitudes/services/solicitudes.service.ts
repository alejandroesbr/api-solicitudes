import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../../core/enums/roles.enum';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { CreateSolicitudDto } from '../dto/create-solicitud.dto';
import { UpdateEstadoSolicitudDto } from '../dto/update-estado-solicitud.dto';
import { Solicitud } from '../entities/solicitud.entity';
import { SolicitudesRepository } from '../repositories/solicitudes.repository';
import { isValidTransition } from './solicitud-transitions';

@Injectable()
export class SolicitudesService {
  constructor(
    private readonly solicitudesRepository: SolicitudesRepository,
    private readonly usersService: UsersService,
  ) {}

  /**
   * RN-01: Registrar solicitudes comerciales.
   * - Si es asesor: se fija automáticamente su propio username.
   * - Si es admin o supervisor: asesor es obligatorio y debe existir con rol asesor.
   */
  async create(dto: CreateSolicitudDto, user: User): Promise<Solicitud> {
    let assignedAsesor: string;

    if (user.role === UserRole.ASESOR) {
      assignedAsesor = user.username;
    } else {
      if (!dto.asesor || dto.asesor.trim() === '') {
        throw new BadRequestException(
          'El campo asesor es obligatorio para usuarios con rol admin o supervisor',
        );
      }
      assignedAsesor = dto.asesor.trim();

      const asesorUser = await this.usersService.findByUsername(assignedAsesor);
      if (!asesorUser || asesorUser.role !== UserRole.ASESOR) {
        throw new BadRequestException(
          `El asesor asignado '${assignedAsesor}' debe existir en el sistema y tener rol asesor`,
        );
      }
    }

    return this.solicitudesRepository.createAndSave({
      cliente: dto.cliente,
      descripcion: dto.descripcion,
      asesor: assignedAsesor,
    });
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
   * RN-03: Cambio de estado de la solicitud.
   * Orden estricto de comprobación:
   * 1. Existencia -> 404
   * 2. Propiedad -> 403 si asesor ajeno
   * 3. Transición de estado -> 409 si inválida
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

    return this.solicitudesRepository.updateEstado(id, dto.estado);
  }
}
