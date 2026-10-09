import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Solicitud } from './entities/solicitud.entity';
import { SolicitudesController } from './controllers/solicitudes.controller';
import { SolicitudesService } from './services/solicitudes.service';
import { SolicitudesRepository } from './repositories/solicitudes.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Solicitud]), UsersModule],
  controllers: [SolicitudesController],
  providers: [SolicitudesRepository, SolicitudesService],
  exports: [SolicitudesService, SolicitudesRepository],
})
export class SolicitudesModule {}
