export interface MongoPaginationOptions {
  page: number;
  limit: number;
}

export interface MongoPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildMongoPaginatedResult<T>(
  data: T[],
  total: number,
  options: MongoPaginationOptions,
): MongoPaginatedResult<T> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, options.limit || 10);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}
