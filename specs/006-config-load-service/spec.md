# Feature Specification: Enterprise Configuration Service

**Feature Branch**: `006-config-load-service`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description:
"I want to implement a reusable Configuration Module inside `libs/core` for a NestJS monorepo.
Create a centralized `ConfigurationService` that can load configuration from:
1. Environment variables (`.env`)
2. YAML configuration files (`config/*.yaml`)
3. Override YAML values with Environment Variables
The configuration should be strongly typed, cached, validated, and injectable throughout the application.
Validation must use one of: class-validator, Zod, Joi (Zod chosen for type inference and clean parser semantics).
If validation fails, the application must stop immediately."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Layered Configuration Loading and Merging (Priority: P1)

As a microservice developer, I want to define configurations in environment-specific or service-specific YAML files, while allowing critical settings to be overridden by environment variables, so that I can manage configs across different environments without code modifications.

**Why this priority**: Fundamental capability of the library to load config values.

**Independent Test**: Start the application with a base YAML file containing a key, an environment variable with the same key, and verify that the environment variable value overrides the YAML value in the loaded configuration.

**Acceptance Scenarios**:

1. **Given** a YAML file `config/database.yaml` contains `database.host = localhost` and `database.port = 5432`, **When** the service loads with the environment variable `DATABASE_HOST=db.production`, **Then** the merged configuration resolves `database.host` to `db.production` and `database.port` to `5432`.
2. **Given** multiple YAML files (e.g., `application.yaml`, `database.yaml`), **When** the service starts up, **Then** the loader deep-merges them into a single nested configuration object.
3. **Given** an environment variable using standard UPPER_SNAKE_CASE (e.g., `JWT_PUBLIC_KEY`), **When** the module maps environment variables, **Then** it automatically maps to the corresponding nested path in the configuration structure (e.g., `jwt.publicKey`) without requiring manual mapping code for each new variable.

---

### User Story 2 - Startup Schema Validation and Fail-Fast (Priority: P1)

As a system operator, I want all configuration values to be validated against a strict schema during application bootstrap, so that the application fails to start if any configuration is missing or invalid, preventing runtime bugs or crash loops.

**Why this priority**: Crucial for production reliability and deployment safety.

**Independent Test**: Attempt to launch the application with a missing mandatory config (e.g., `JWT_PRIVATE_KEY` not set) or invalid types (e.g., `DATABASE_PORT` set to `abc`), and verify that the application prints validation errors and exits immediately with code 1.

**Acceptance Scenarios**:

1. **Given** the environment variable `DATABASE_PORT` is set to `abc`, **When** the service starts up, **Then** validation fails because `database.port` is not a number, and the process exits with `ConfigurationValidationException`.
2. **Given** a required key like `JWT_PRIVATE_KEY` is omitted, **When** the service starts up, **Then** validation fails and the process exits with `ConfigurationValidationException` explaining the missing key.
3. **Given** validation fails for multiple keys, **When** the service starts up, **Then** all validation failures are collected and printed together before the process exits.

---

### User Story 3 - Injected, Cached, and Type-Safe Configuration Access (Priority: P2)

As a NestJS developer, I want to inject a singleton configuration service and access keys via nested paths (e.g., `get('database.host')`) with full type safety, so that I can use configuration properties in other modules without performance overhead or unsafe casting.

**Why this priority**: Simplifies and standardizes downstream code integration.

**Independent Test**: Inject `ConfigurationService` into a NestJS component and verify that calling `get()` retrieves the correct type-safe value from memory without triggering additional filesystem reads.

**Acceptance Scenarios**:

1. **Given** the configuration is initialized and cached, **When** `config.get<string>('database.host')` is called, **Then** it returns the cached host string without reading any files.
2. **Given** a request for a non-existent configuration path, **When** `config.getOrThrow('invalid.path')` is called, **Then** a `ConfigurationNotFoundException` is thrown.
3. **Given** the service runs in the production environment, **When** `config.isProduction()` is called, **Then** it returns `true`.

---

### User Story 4 - Runtime Hot Reloading (Priority: P3)

As a developer or operator, I want to reload the YAML configuration files at runtime without restarting the application, so that updated config values are picked up dynamically.

**Why this priority**: Operational flexibility, allowing config updates (e.g., logging levels or feature flags) to apply immediately.

**Independent Test**: Modify a value in a YAML configuration file on disk, call `config.reload()`, and verify that subsequent calls to `config.get()` return the updated value.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** `config.reload()` is invoked after a YAML configuration file is modified on disk, **Then** the updated values are merged and re-validated, updating the internal configuration cache.
2. **Given** a reload operation fails validation (e.g., a required key is deleted), **When** `config.reload()` is called, **Then** it throws an `InvalidConfigurationException` and rolls back to the previous valid cached configuration without crashing the running process.

---

### Edge Cases

- **Malformed YAML**: A YAML file is syntactically invalid.
  - *Resolution*: The loader must catch parsing errors and throw an `InvalidConfigurationException` to stop startup.
- **Environment Variable Mapping Collision**: Flat environment variable names that map ambiguously.
  - *Resolution*: Environment mapping rules must be deterministic and documented.
- **Concurrent Requests during Reload**: A component accesses the configuration while a hot-reload is in progress.
  - *Resolution*: The service must use an atomic reference swap or synchronization lock during reload to prevent partial configuration reads.
- **Secret Leaks in Logs**: Logging configuration status could expose passwords or tokens.
  - *Resolution*: The configuration service must implement a masking utility to scrub sensitive keys (e.g., containing `password`, `key`, `secret`, `token`) from logs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST deep-merge multiple YAML files located in `config/*.yaml` into a single configuration object.
- **FR-002**: System MUST load configuration using priority: Environment Variables > YAML Files > Default Values.
- **FR-003**: System MUST validate the configuration object at startup using **Zod** schemas.
- **FR-004**: System MUST terminate the NestJS process immediately if validation fails during bootstrap.
- **FR-005**: System MUST automatically map flat environment variables (e.g., `REDIS_HOST`) into nested keys (e.g., `redis.host`).
- **FR-006**: System MUST cache configuration in memory and satisfy subsequent reads without file or env lookups.
- **FR-007**: `ConfigurationService` MUST implement the following interface methods:
  - `get<T>(path: string): T`
  - `getOrThrow<T>(path: string): T`
  - `has(path: string): boolean`
  - `all(): Configuration`
  - `reload(): void`
  - `isProduction(): boolean`
  - `isDevelopment(): boolean`
  - `isTest(): boolean`
- **FR-008**: System MUST support NestJS dependency injection using a singleton `ConfigurationService` and a global-scope `ConfigurationModule`.
- **FR-009**: System MUST log a load summary during bootstrap detailing sources (YAMLs, `.env`) and active environment, while masking all secrets.
- **FR-010**: System MUST define and throw custom exceptions: `ConfigurationNotFoundException`, `ConfigurationValidationException`, and `InvalidConfigurationException`.

### Key Entities

- **Configuration**: The root type-safe configuration object containing sub-objects:
  - `app`: Application metadata (name, port, env).
  - `database`: Database connection settings (host, port, username, password).
  - `redis`: Redis connection settings (host, port).
  - `kafka`: Kafka broker locations (brokers array).
  - `jwt`: Authentication keys (publicKey, privateKey).
- **Zod Schema Definition**: The runtime validator schemas that enforce types, structures, and constraints for each sub-object.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of configuration errors (missing keys, type mismatches) prevent the application from starting and cause a clean shutdown.
- **SC-002**: No file reads occur for configuration retrieval after the application bootstrap phase (except during explicit `reload()` calls).
- **SC-003**: All logged configuration summaries show masked values for keys containing "password", "secret", "token", or "key" (e.g. `jwt.privateKey: [MASKED]`).
- **SC-004**: Test coverage of the Configuration Service, Loader, and Schemas exceeds 90% in unit and integration tests.

## Assumptions

- **Zod Choice**: Zod is chosen as the schema validation library because of its first-class TypeScript inference capabilities (`z.infer<typeof schema>`). This allows us to generate the `Configuration` interface dynamically from the schemas, ensuring a single source of truth and reducing typescript boilerplate.
- **Env Mapping Convention**: Environment variables map to nested YAML keys via double underscore parsing (e.g., `DATABASE__HOST` maps to `database.host`, or standard variable prefixes mapped via a pre-defined mapping table).
- **Files Location**: Base configurations are located in the `config/` directory at the project root.
- **NestJS Context**: The module is designed as an infrastructure module in `libs/core` to be shared among microservices.
