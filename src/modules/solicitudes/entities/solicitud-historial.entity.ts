import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoEventoHistorial } from '../../../core/enums/tipo-evento-historial.enum';
import { Solicitud } from './solicitud.entity';

@Entity('solicitud_historial')
export class SolicitudHistorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'solicitud_id', type: 'integer' })
  solicitudId: number;

  @ManyToOne(() => Solicitud, (solicitud) => solicitud.historial, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud?: Solicitud;

  @Column({
    name: 'tipo_evento',
    type: 'varchar',
    length: 50,
  })
  tipoEvento: TipoEventoHistorial;

  @Column({
    name: 'valor_anterior',
    type: 'text',
    nullable: true,
  })
  valorAnterior: string | null;

  @Column({
    name: 'valor_nuevo',
    type: 'text',
  })
  valorNuevo: string;

  @Column({
    name: 'usuario_actor',
    type: 'varchar',
    length: 255,
  })
  usuarioActor: string;

  @CreateDateColumn({ name: 'fecha_evento' })
  fechaEvento: Date;
}

