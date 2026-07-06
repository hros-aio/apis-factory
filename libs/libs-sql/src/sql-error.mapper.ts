import {
  BusinessException,
  ConflictException,
  ValidationException,
} from '@new-hros/libs-core';

export class SqlErrorMapper {
  static map(error: any): Error {
    if (!error) return new Error('Unknown database error');

    // Handle standard PostgreSQL error codes (e.g., from pg driver)
    const code = error.code || error.driverError?.code;

    switch (code) {
      case '23505': // unique_violation
        return new ConflictException(error.detail || 'Unique constraint violation occurred');
      case '23503': // foreign_key_violation
        return new ConflictException(error.detail || 'Foreign key constraint violation occurred');
      case '23502': // not_null_violation
        return new ValidationException(`Field '${error.column}' cannot be null`);
      default:
        return new BusinessException(error.message || 'Database error occurred', 'DATABASE_ERROR', 500);
    }
  }
}
