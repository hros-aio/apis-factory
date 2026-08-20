import { CrossCompanyReferenceException } from '../src/exceptions';

describe('CrossCompanyReferenceException', () => {
  it('should create an exception with default message and status 400', () => {
    const exception = new CrossCompanyReferenceException();
    expect(exception.getStatus()).toBe(400);

    const response = exception.getResponse() as Record<string, unknown>;
    expect(response.statusCode).toBe(400);
    expect(response.error).toBe('Bad Request');
    expect(response.message).toBe('Cross-company entity reference is strictly prohibited');
    expect(response.code).toBe('CROSS_COMPANY_REFERENCE_PROHIBITED');
  });

  it('should allow custom message', () => {
    const customMessage = 'Custom cross-company violation message';
    const exception = new CrossCompanyReferenceException(customMessage);
    expect(exception.getStatus()).toBe(400);

    const response = exception.getResponse() as Record<string, unknown>;
    expect(response.message).toBe(customMessage);
    expect(response.code).toBe('CROSS_COMPANY_REFERENCE_PROHIBITED');
  });
});
