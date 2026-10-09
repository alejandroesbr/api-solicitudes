import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../modules/users/services/users.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userHeader = request.headers['x-user'];

    if (!userHeader) {
      throw new UnauthorizedException('Encabezado x-user es requerido');
    }

    const username = Array.isArray(userHeader)
      ? userHeader[0]?.trim()
      : userHeader.trim();

    if (!username) {
      throw new UnauthorizedException('Encabezado x-user no puede estar vacío');
    }

    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException(
        `Usuario '${username}' no registrado en el sistema`,
      );
    }

    (request as any).user = user;
    return true;
  }
}
