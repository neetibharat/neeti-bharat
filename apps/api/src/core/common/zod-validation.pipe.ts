import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { AppException } from './app.exception';

/** Validates a request body against a zod schema; failures become VALIDATION_FAILED. */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    }
    return result.data;
  }
}
