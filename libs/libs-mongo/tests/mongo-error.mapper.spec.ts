import { MongoErrorMapper } from '../src/mongo-error.mapper';
import { ConflictException, ValidationException, BusinessException } from '@new-hros/libs-core';

describe('MongoErrorMapper', () => {
  it('should map duplicate key error 11000 to ConflictException', () => {
    const error = { code: 11000, message: 'E11000 duplicate key error collection' };
    const mapped = MongoErrorMapper.map(error);
    expect(mapped).toBeInstanceOf(ConflictException);
    expect(mapped.message).toContain('duplicate key');
  });

  it('should map ValidationError to ValidationException', () => {
    const error = {
      name: 'ValidationError',
      message: 'Validation failed',
      errors: {
        tenantCode: { message: 'Path tenantCode is required.' },
      },
    };
    const mapped = MongoErrorMapper.map(error);
    expect(mapped).toBeInstanceOf(ValidationException);
    expect((mapped as ValidationException).errors?.tenantCode).toEqual(['Path tenantCode is required.']);
  });

  it('should map CastError to ValidationException', () => {
    const error = { name: 'CastError', path: 'age' };
    const mapped = MongoErrorMapper.map(error);
    expect(mapped).toBeInstanceOf(ValidationException);
    expect(mapped.message).toContain("path 'age'");
  });
});
