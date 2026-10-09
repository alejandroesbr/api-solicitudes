import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyGuard } from './core/guards/api-key.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { UserGuard } from './core/guards/user.guard';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_DATABASE', 'database.sqlite'),
        autoLoadEntities: true,
        synchronize: true, // Decisión de la prueba técnica para SQLite local
      }),
    }),
    UsersModule,
    SolicitudesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: UserGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const rawKeys = this.configService.get<string>('API_KEYS', '');
    const keys = rawKeys
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      throw new Error(
        'FATAL: Variable de entorno API_KEYS no configurada o vacía. La aplicación no puede iniciar.',
      );
    }
  }
}