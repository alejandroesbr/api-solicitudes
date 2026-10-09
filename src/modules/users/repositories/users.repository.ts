import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username } });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async saveMany(users: Partial<User>[]): Promise<User[]> {
    const entities = this.repository.create(users);
    return this.repository.save(entities);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }
}

