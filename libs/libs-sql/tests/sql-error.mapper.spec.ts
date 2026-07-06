import { SqlErrorMapper } from '../src/sql-error.mapper';
import { ConflictException, ValidationException, BusinessException } from '@new-hros/libs-core';

describe('SqlErrorMapper', () => {
  it('should map unique constraint violation code 23505 to ConflictException', () => {
    const error = { code: '23505', detail: 'Key (email)=(test@example.com) already exists.' };
    const mapped = SqlErrorMapper.map(error);
    expect(mapped).toBeInstanceOf(ConflictException);
    expect(mapped.message).toContain('already exists');
  });

  it('should map foreign key violation code 23503 to ConflictException', () => {
    const error = { code: '23503', detail: 'Key (tenant_code)=(invalid) is not present in table.' };
    const mapped = SqlErrorMapper.map(error);
    expect(mapped).toBeInstanceOf(ConflictException);
    expect(mapped.message).toContain('is not present');
  });

  it('should map not null violation code 23502 to ValidationException', () => {
    const error = { code: '23502', column: 'tenant_code' };
    const mapped = SqlErrorMapper.map(error);
    expect(mapped).toBeInstanceOf(ValidationException);
    expect(mapped.message).toContain("tenant_code' cannot be null");
  });

  it('should fallback to BusinessException for other database errors', () => {
    const error = { code: 'other', message: 'Some db connection issue' };
    const mapped = SqlErrorMapper.map(error);
    expect(mapped).toBeInstanceOf(BusinessException);
    expect((mapped as BusinessException).status).toBe(500);
  });
});
