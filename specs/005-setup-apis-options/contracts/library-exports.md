# Library Interface Contracts: Reusable API Infrastructure Options

This document defines the TypeScript interfaces, function signatures, and exported classes provided by the library.

## 1. CORS Configuration

### Function Signature
```typescript
export function createCorsOptions(overrides?: Partial<CorsOptions>): CorsOptions;
```

### Type Definitions
Imports standard `CorsOptions` from `@nestjs/common/interfaces/external/cors-options.interface`.

---

## 2. Swagger Configuration

### Function Signature
```typescript
export function setupSwagger(app: INestApplication, options?: SwaggerSetupOptions): void;
```

### Type Definitions
```typescript
export interface SwaggerSetupOptions {
  title?: string;
  description?: string;
  version?: string;
  serverUrl?: string;
  bearerAuth?: boolean;
  tags?: string[];
  externalDocTitle?: string;
  externalDocUrl?: string;
  path?: string; // Custom route path (e.g. 'docs', 'api-docs')
  enabled?: boolean; // Override env SWAGGER_ENABLED setting
}
```

---

## 3. API Versioning

### Function Signature
```typescript
export function setupVersioning(app: INestApplication, options?: VersioningSetupOptions): void;
```

### Type Definitions
```typescript
export interface VersioningSetupOptions {
  defaultVersion?: string;
}
```
*Note: This helper forces the `VersioningType.MEDIA_TYPE` strategy and configures the key name as `v`.*

---

## 4. Pagination Utilities

### Function Signatures
```typescript
export function calculateSkip(page: number, limit: number): number;

export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMetaDto;

export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResponseDto<T>;
```

### DTOs & Classes
```typescript
export class PaginationQueryDto {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
}

export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class PaginationResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;
}
```
