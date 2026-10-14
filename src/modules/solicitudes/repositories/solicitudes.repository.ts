import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { EstadoSolicitud } from '../../../core/enums/estados.enum';
import { TipoEventoHistorial } from '../../../core/enums/tipo-evento-historial.enum';
import { Solicitud } from '../entities/solicitud.entity';
import { SolicitudHistorial } from '../entities/solicitud-historial.entity';

export interface SolicitudFilterOptions {
  asesor?: string;
}

@Injectable()
export class SolicitudesRepository {
  constructor(
    @InjectRepository(Solicitud)
    private readonly repository: Repository<Solicitud>,
    @InjectRepository(SolicitudHistorial)
    private readonly historialRepository: Repository<SolicitudHistorial>,
    private readonly dataSource: DataSource,
  ) {}

  async createAndSave(
    data: {
      cliente: string;
      descripcion: string;
      asesor: string | null;
    },
    actorUsername: string,
  ): Promise<Solicitud> {
    return this.dataSource.transaction(async (manager) => {
      const solicitudRepo = manager.getRepository(Solicitud);
      const historialRepo = manager.getRepository(SolicitudHistorial);

      const solicitud = solicitudRepo.create({
        cliente: data.cliente,
        descripcion: data.descripcion,
        asesor: data.asesor,
        estado: EstadoSolicitud.PENDIENTE,
      });
      const savedSolicitud = await solicitudRepo.save(solicitud);

      const historial = historialRepo.create({
        solicitudId: savedSolicitud.id,
        tipoEvento: TipoEventoHistorial.CREACION,
        valorAnterior: null,
        valorNuevo: EstadoSolicitud.PENDIENTE,
        usuarioActor: actorUsername,
      });
      await historialRepo.save(historial);

      return savedSolicitud;
    });
  }

  async findById(id: number): Promise<Solicitud | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(filter?: SolicitudFilterOptions): Promise<Solicitud[]> {
    const where: FindOptionsWhere<Solicitud> = {};

    if (filter?.asesor) {
      where.asesor = filter.asesor;
    }

    return this.repository.find({
      where,
      order: { id: 'DESC' },
    });
  }

  async assign(
    id: number,
    targetAsesor: string,
    actorUsername: string,
  ): Promise<Solicitud> {
    return this.dataSource.transaction(async (manager) => {
      const solicitudRepo = manager.getRepository(Solicitud);
      const historialRepo = manager.getRepository(SolicitudHistorial);

      const solicitud = await solicitudRepo.findOne({ where: { id } });
      if (!solicitud) {
        throw new Error(`Solicitud ${id} no encontrada en la transacción`);
      }

      const valorAnterior = solicitud.asesor ?? null;
      solicitud.asesor = targetAsesor;
      const updated = await solicitudRepo.save(solicitud);

      const historial = historialRepo.create({
        solicitudId: updated.id,
        tipoEvento: TipoEventoHistorial.ASIGNACION,
        valorAnterior,
        valorNuevo: targetAsesor,
        usuarioActor: actorUsername,
      });
      await historialRepo.save(historial);

      return updated;
    });
  }

  async updateEstado(
    id: number,
    nuevoEstado: EstadoSolicitud,
    actorUsername: string,
  ): Promise<Solicitud> {
    return this.dataSource.transaction(async (manager) => {
      const solicitudRepo = manager.getRepository(Solicitud);
      const historialRepo = manager.getRepository(SolicitudHistorial);

      const solicitud = await solicitudRepo.findOne({ where: { id } });
      if (!solicitud) {
        throw new Error(`Solicitud ${id} no encontrada en la transacción`);
      }

      const valorAnterior = solicitud.estado;
      solicitud.estado = nuevoEstado;
      const updated = await solicitudRepo.save(solicitud);

      const historial = historialRepo.create({
        solicitudId: updated.id,
        tipoEvento: TipoEventoHistorial.ESTADO,
        valorAnterior,
        valorNuevo: nuevoEstado,
        usuarioActor: actorUsername,
      });
      await historialRepo.save(historial);

      return updated;
    });
  }

  async findHistorialBySolicitudId(
    solicitudId: number,
  ): Promise<SolicitudHistorial[]> {
    return this.historialRepository.find({
      where: { solicitudId },
      order: { id: 'ASC' },
    });
  }
}
