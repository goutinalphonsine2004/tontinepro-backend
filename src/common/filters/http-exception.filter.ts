import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statut = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur interne est survenue';
    let code: string | undefined;

    if (exception instanceof HttpException) {
      statut = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b.message as string) || message;
        code = b.code as string | undefined;
      } else {
        message = body as string;
      }
    }

    response.status(statut).json({
      succes: false,
      message: Array.isArray(message) ? message[0] : message,
      ...(code && { code }),
    });
  }
}
