import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/** The one error shape every response uses (docs/design/api.md, "Errors"). */
export interface ApiErrorBody {
  statusCode: number;
  error: string; // a code like PHONE_ALREADY_REGISTERED
  message: string; // a sentence a person can read
}

// Codes for errors that don't bring their own (e.g. Nest's built-in 404).
const DEFAULT_CODES: Record<number, string> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  410: 'GONE',
  422: 'BUSINESS_RULE_BROKEN',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Catches every error and rewrites it into ApiErrorBody,
 * so the frontend can handle all errors in one place.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (!(exception instanceof HttpException)) {
      // A bug or crash: log the details for us, but don't show them to the user.
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'INTERNAL_ERROR',
        message: 'Something went wrong on our side. Please try again.',
      };
    }

    const statusCode = exception.getStatus();
    const raw = exception.getResponse();
    const details = (typeof raw === 'object' && raw !== null ? raw : {}) as {
      error?: unknown;
      message?: unknown;
    };

    // Our own codes are UPPER_SNAKE_CASE. Nest's built-in ones ("Not Found") are not.
    const error =
      typeof details.error === 'string' && /^[A-Z][A-Z_]*$/.test(details.error)
        ? details.error
        : (DEFAULT_CODES[statusCode] ?? 'ERROR');

    // Validation errors come as a list of messages; join them into one sentence.
    const message = Array.isArray(details.message)
      ? details.message.join(' ')
      : typeof details.message === 'string'
        ? details.message
        : typeof raw === 'string'
          ? raw
          : exception.message;

    return { statusCode, error, message };
  }
}
