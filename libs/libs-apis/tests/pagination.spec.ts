import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from '../src/pagination/pagination.dto';
import {
  calculateSkip,
  createPaginationMeta,
  createPaginationResponse,
} from '../src/pagination/pagination.utils';

describe('Pagination Utilities & DTO Validation', () => {
  describe('PaginationQueryDto Validation', () => {
    async function validateQuery(plain: any) {
      const dtoInstance = plainToInstance(PaginationQueryDto, plain);
      return validate(dtoInstance);
    }

    it('should pass validation with empty or default query parameters', async () => {
      const errors = await validateQuery({});
      expect(errors.length).toBe(0);
    });

    it('should pass validation with valid pagination parameters', async () => {
      const errors = await validateQuery({
        page: '2',
        limit: '10',
        sort: 'createdAt',
        order: 'DESC',
        search: 'test',
      });
      expect(errors.length).toBe(0);
    });

    it('should fail validation if page is negative or not an integer', async () => {
      const errorsNegative = await validateQuery({ page: '-1' });
      expect(errorsNegative.length).toBeGreaterThan(0);

      const errorsFloat = await validateQuery({ page: '2.5' });
      expect(errorsFloat.length).toBeGreaterThan(0);
    });

    it('should fail validation if limit is negative or exceeds 100', async () => {
      const errorsNegative = await validateQuery({ limit: '-5' });
      expect(errorsNegative.length).toBeGreaterThan(0);

      const errorsMax = await validateQuery({ limit: '101' });
      expect(errorsMax.length).toBeGreaterThan(0);
    });

    it('should fail validation if order is not ASC or DESC', async () => {
      const errors = await validateQuery({ order: 'INVALID' });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Calculation Helpers', () => {
    it('should calculate skip correctly for 1-indexed pagination', () => {
      expect(calculateSkip(1, 10)).toBe(0);
      expect(calculateSkip(2, 10)).toBe(10);
      expect(calculateSkip(3, 20)).toBe(40);
      expect(calculateSkip(0, 10)).toBe(0); // fallback if page < 1
    });

    it('should generate correct pagination metadata', () => {
      // Scenario from spec: page 2, limit 10, total 25
      const meta = createPaginationMeta(25, 2, 10);
      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      });

      // Checks edge cases
      const metaStart = createPaginationMeta(10, 1, 10);
      expect(metaStart.hasNext).toBe(false);
      expect(metaStart.hasPrevious).toBe(false);
      expect(metaStart.totalPages).toBe(1);
    });

    it('should create pagination response wrapper', () => {
      const data = ['item1', 'item2'];
      const response = createPaginationResponse(data, 25, 2, 10);

      expect(response.data).toEqual(data);
      expect(response.meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      });
    });
  });
});
