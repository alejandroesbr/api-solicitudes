import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoSolicitud } from '../../../core/enums/estados.enum';
import { SolicitudHistorial } from './solicitud-historial.entity';

@Entity('solicitudes_comerciales')
export class Solicitud {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  cliente: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  asesor: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: EstadoSolicitud.PENDIENTE,
  })
  estado: EstadoSolicitud;

  @CreateDateColumn({ name: 'creada_en' })
  creada_en: Date;

  @UpdateDateColumn({ name: 'actualizada_en' })
  actualizada_en: Date;

  @OneToMany(() => SolicitudHistorial, (historial) => historial.solicitud)
  historial?: SolicitudHistorial[];
}
