import { PaginationMetaDto, PaginationResponseDto } from './pagination.dto';

/**
 * Calculates the SQL skip (offset) offset based on page and limit.
 * Assumes 1-indexed pagination.
 *
 * @param page The requested page number (starts at 1).
 * @param limit The items limit per page.
 * @returns Offset count (skip value).
 */
export function calculateSkip(page?: number, limit?: number): number {
  const p = page && page > 0 ? page : 1;
  const l = limit && limit > 0 ? limit : 20;
  return (p - 1) * l;
}

/**
 * Generates pagination metadata for the client response.
 *
 * @param total Total number of records matching the query.
 * @param page Current requested page number.
 * @param limit Items per page.
 * @returns Calculated PaginationMetaDto.
 */
export function createPaginationMeta(
  total: number,
  page?: number,
  limit?: number,
): PaginationMetaDto {
  const p = page && page > 0 ? page : 1;
  const l = limit && limit > 0 ? limit : 20;

  const totalPages = Math.max(0, Math.ceil(total / l));
  const hasNext = p < totalPages;
  const hasPrevious = p > 1;

  return {
    page: p,
    limit: l,
    total,
    totalPages,
    hasNext,
    hasPrevious,
  };
}

/**
 * Wraps list data and calculates pagination metadata into a standardized PaginationResponseDto.
 *
 * @param data Array of records on the current page.
 * @param total Total number of records.
 * @param page Current requested page number.
 * @param limit Items per page.
 * @returns Standardized pagination response.
 */
export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page?: number,
  limit?: number,
): PaginationResponseDto<T> {
  return {
    data,
    meta: createPaginationMeta(total, page, limit),
  };
}
