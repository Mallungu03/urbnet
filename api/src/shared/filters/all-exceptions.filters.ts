import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type HttpExceptionResponse =
  | string
  | {
      statusCode?: number;
      message?: string | string[];
      error?: string;
      errors?: unknown;
      details?: unknown;
      [key: string]: unknown;
    };

type ErrorPayload = {
  statusCode: number;
  error: {
    type: string;
    message: string;
    details?: unknown;
    code?: string;
  };
  path: string;
  method: string;
  timestamp: string;
  requestId?: string;
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const defaultErrorTypeForStatus = (status: number) => {
  const raw = HttpStatus[status] ?? 'ERROR';
  return typeof raw === 'string' ? toTitleCase(raw) : 'Error';
};

const normalizeMessage = (
  value: string | string[] | undefined,
  fallback: string,
) => {
  if (!value) return fallback;
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value;
};

@Catch()
export class AllExceptionsFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = ctx.getResponse();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errorType = defaultErrorTypeForStatus(status);
    let details: unknown;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as
        | HttpExceptionResponse
        | undefined;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        message = normalizeMessage(
          exceptionResponse.message,
          exception.message,
        );
        errorType =
          exceptionResponse.error ??
          exception.name ??
          defaultErrorTypeForStatus(status);

        details =
          exceptionResponse.details ?? exceptionResponse.errors ?? undefined;
      } else {
        message = exception.message || message;
        errorType = exception.name ?? errorType;
      }
    }

    const payload: ErrorPayload = {
      statusCode: status,
      error: {
        type: errorType,
        message,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      path: request.url,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      method: request.method,
      timestamp: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      requestId: request.id,
    };

    const exceptionWithCode = exception as { code?: string } | null;
    if (exceptionWithCode?.code) {
      payload.error.code = exceptionWithCode.code;
    }

    if (details) {
      payload.error.details = details;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    response.status(status).send(payload);
  }
}
