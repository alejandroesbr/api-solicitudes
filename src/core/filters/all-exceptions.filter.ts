import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Ha ocurrido un error inesperado';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name.replace('Exception', '');
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message ?? exception.message;
        error = resObj.error ?? exception.name.replace('Exception', '');
      }
    } else {
      const err = exception as Error;
      this.logger.error(
        `Unhandled Exception on ${request.method} ${request.url}: ${err?.message}`,
        err?.stack,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      error,
      message,
      path: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
