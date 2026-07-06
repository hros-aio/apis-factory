import {
  BusinessException,
  ConflictException,
  ValidationException,
} from '@new-hros/libs-core';

export class MongoErrorMapper {
  static map(error: any): Error {
    if (!error) return new Error('Unknown MongoDB error');

    if (error.code === 11000) {
      return new ConflictException(error.message || 'Duplicate key constraint violation');
    }

    if (error.name === 'ValidationError') {
      const formattedErrors = Object.keys(error.errors || {}).reduce((acc, key) => {
        acc[key] = [error.errors[key].message];
        return acc;
      }, {} as Record<string, string[]>);
      return new ValidationException(error.message || 'Validation failed', formattedErrors);
    }

    if (error.name === 'CastError') {
      return new ValidationException(`Invalid value for path '${error.path}'`);
    }

    return new BusinessException(error.message || 'MongoDB error occurred', 'DATABASE_ERROR', 500);
  }
}
