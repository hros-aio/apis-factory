# Data Model: Reusable API Infrastructure Options

This document defines the schemas and validation rules for the pagination and configuration entities.

## Entities & Interfaces

### 1. PaginationQuery
Represents the request query parameters (`req.query`) for list endpoints.

| Field | Type | Validation Rules | Description |
|---|---|---|---|
| `page` | `number` | `@IsOptional()`, `@IsInt()`, `@Min(0)`, `@Type(() => Number)` | The page number to retrieve (0-indexed). Defaults to 0. |
| `limit` | `number` | `@IsOptional()`, `@IsInt()`, `@Min(0)`, `@Max(100)`, `@Type(() => Number)` | Number of items per page. Defaults to 20. Max 100. |
| `sort` | `string` | `@IsOptional()`, `@IsString()` | The field name to sort the results by. |
| `order` | `'ASC' \| 'DESC'` | `@IsOptional()`, `@IsIn(['ASC', 'DESC'])` | Sort direction. Defaults to 'ASC'. |
| `search` | `string` | `@IsOptional()`, `@IsString()` | Optional search term for filtering. |

### 2. PaginationMeta
Represents the calculated metadata returned in the response wrapper.

| Field | Type | Description |
|---|---|---|
| `page` | `number` | The current page number (0-indexed). |
| `limit` | `number` | The number of items per page. |
| `total` | `number` | The total number of items available. |
| `totalPages` | `number` | The total number of pages calculated as `Math.ceil(total / limit)`. |
| `hasNext` | `boolean` | Flag indicating if a next page exists. |
| `hasPrevious` | `boolean` | Flag indicating if a previous page exists. |

### 3. PaginationResponse<T>
The generic paginated response structure wrapping data and metadata.

| Field | Type | Description |
|---|---|---|
| `data` | `T[]` | An array of paginated data items. |
| `meta` | `PaginationMeta` | The pagination metadata object. |
