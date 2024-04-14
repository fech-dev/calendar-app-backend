import { ArgumentsHost, Catch, NotFoundException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { NotFoundError } from './errors/not-found.error';

@Catch()
export class ExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof NotFoundError) {
      super.catch(new NotFoundException('Document not found'), host);
    }

    super.catch(exception, host);
  }
}
