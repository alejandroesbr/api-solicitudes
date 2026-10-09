import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Solicitud } from '../entities/solicitud.entity';
import { EstadoSolicitud } from '../../../core/enums/estados.enum';

export interface SolicitudFilterOptions {
  asesor?: string;
}

@Injectable()
export class SolicitudesRepository {
  constructor(
    @InjectRepository(Solicitud)
    private readonly repository: Repository<Solicitud>,
  ) {}

  async createAndSave(data: {
    cliente: string;
    descripcion: string;
    asesor: string;
  }): Promise<Solicitud> {
    const solicitud = this.repository.create({
      cliente: data.cliente,
      descripcion: data.descripcion,
      asesor: data.asesor,
      estado: EstadoSolicitud.PENDIENTE,
    });
    return this.repository.save(solicitud);
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

  async updateEstado(id: number, nuevoEstado: EstadoSolicitud): Promise<Solicitud> {
    await this.repository.update(id, { estado: nuevoEstado });
    const updated = await this.findById(id);
    return updated!;
  }
}
