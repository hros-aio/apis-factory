# Research: Enterprise Configuration Service

This research document analyzes the design decisions, patterns, and technologies chosen for the NestJS Enterprise Configuration Service module.

---

## Decision 1: Validation Library Selection

### Decision
Choose **Zod** as the schema validation and parsing library.

### Rationale
- **Type Inference**: Zod allows us to infer TypeScript types directly from schemas (using `z.infer<typeof schema>`). This eliminates duplicate code (defining both a typescript interface/class and a validation schema) and ensures type safety.
- **Fail-Fast Behavior**: Zod collects all validation errors during parsing, allowing the service to present all configuration errors to the operator at startup before stopping the application.
- **Transformation Capabilities**: Zod allows seamless preprocessing and coercion (e.g., parsing a string `PORT` env variable into a number), which is highly beneficial for processing environment variables.
- **Zero Runtime Decorator Overhead**: Joi and Zod don't require decorators, which aligns perfectly with processing raw merged JS objects parsed from YAML and process.env.

### Alternatives Considered
- **class-validator / class-transformer**:
  - *Why rejected*: Requires creating class instances and using decorators. While it works well in NestJS controller DTOs, it requires heavy boilerplate for nested configuration objects, and doesn't easily support automatic type inference.
- **Joi**:
  - *Why rejected*: Lacks modern TypeScript type inference. Maintaining separate TypeScript types and Joi schemas results in duplicate maintenance effort and potential drift.

---

## Decision 2: YAML Parsing Library

### Decision
Use **js-yaml** to load and parse YAML configuration files.

### Rationale
- **Stability and Performance**: `js-yaml` is the standard parser for Node.js with high performance and full YAML 1.2 support.
- **Reduced Dependency Overhead**: `js-yaml` is already used transitively in the project (by `@nestjs/swagger` and `istanbul`), so adding it as a direct dependency adds zero weight to the lockfile.

### Alternatives Considered
- **yaml (npm library)**:
  - *Why rejected*: While it is a modern alternative, using a package already resolved in the lockfile (`js-yaml`) is preferred to preserve dependency footprints.

---

## Decision 3: Environment Variable Mapping & Overrides

### Decision
Implement a custom flat-to-nested object parser for environment variables, using deep merging to apply them on top of YAML configurations.

### Rationale
- **Automatic Mapping**: The custom parser will process env keys that start with specific prefixes or use double-underscores (e.g., `DATABASE__PORT` maps to `database.port`). It can also parse standard single-underscore variables by matching them against defined schema structures.
- **Deep Merging**: A custom utility `deepMerge` will combine default values, YAML configurations, and environment overrides recursively without overwriting nested structures (e.g., overriding `database.host` will not erase `database.port`).

### Alternatives Considered
- **Manual Mapping**:
  - *Why rejected*: Requires writing custom mapping code for every single new configuration key, which violates OCP (Open-Closed Principle) and makes the system harder to maintain.
- **NestJS @nestjs/config Built-in Parser**:
  - *Why rejected*: The built-in config module doesn't natively support automatic layered merging of multiple YAML files with flat environment variable overrides in a type-safe manner without writing custom loader wrappers. We build a specialized service for maximum control and custom exceptions.
