import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validApiKeys: Set<string>;

  constructor(private readonly configService: ConfigService) {
    const rawKeys = this.configService.get<string>('API_KEYS', '');
    const keys = rawKeys
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      throw new Error(
        'FATAL: Variable de entorno API_KEYS no configurada o vacía.',
      );
    }

    this.validApiKeys = new Set(keys);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new UnauthorizedException('Encabezado x-api-key es requerido');
    }

    const providedKey = Array.isArray(apiKeyHeader)
      ? apiKeyHeader[0]?.trim()
      : apiKeyHeader.trim();

    if (!providedKey || !this.validApiKeys.has(providedKey)) {
      throw new UnauthorizedException('API key no válida');
    }

    return true;
  }
}
