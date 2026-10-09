import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserRole } from '../../../core/enums/roles.enum';
import { User } from '../entities/user.entity';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  async seedUsers(): Promise<void> {
    const count = await this.usersRepository.count();
    if (count === 0) {
      this.logger.log('Poblando usuarios iniciales (seed)...');
      await this.usersRepository.saveMany([
        { username: 'admin', role: UserRole.ADMIN },
        { username: 'supervisor', role: UserRole.SUPERVISOR },
        { username: 'asesor1', role: UserRole.ASESOR },
        { username: 'asesor2', role: UserRole.ASESOR },
      ]);
      this.logger.log('Usuarios iniciales cargados exitosamente.');
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }
}

