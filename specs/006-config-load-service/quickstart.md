# Quickstart Validation Guide

This document describes how to run and validate the NestJS Enterprise Configuration Service in the application development and testing environments.

---

## 1. Setup Configuration Files

Create a `config` directory in your workspace and populate it with sample YAML files.

### `config/application.yaml`
```yaml
app:
  name: "hros-api-gateway"
  port: 3000
  env: "development"
```

### `config/database.yaml`
```yaml
database:
  host: "localhost"
  port: 5432
  username: "postgres"
  password: "postgres_default_pass"
  name: "hros_db"
```

### `config/redis.yaml`
```yaml
redis:
  host: "localhost"
  port: 6379
```

### `config/kafka.yaml`
```yaml
kafka:
  brokers:
    - "localhost:9092"
```

### `config/jwt.yaml`
```yaml
jwt:
  publicKey: "default-public-key"
  privateKey: "default-private-key"
```

---

## 2. Validation Scenarios

### Scenario A: Successful Loaded Configuration (Default YAML)

Run the application with default settings.

#### Execution
```bash
npm run build -w @new-hros/libs-core
npm run test -w @new-hros/libs-core -- tests/configuration.spec.ts
```

#### Expected Success Logs
```text
✔ Configuration Loaded

Source:
- application.yaml
- database.yaml
- redis.yaml
- kafka.yaml
- jwt.yaml

Environment:
development
```

---

### Scenario B: Layered Environment Variable Overrides

Set environment variables to override default YAML values.

#### Execution
```bash
export DATABASE_HOST="prod-db.hros.internal"
export DATABASE_PORT="5433"
export DATABASE_PASSWORD="secret_production_password"

# Launch your microservice
npm run start:dev
```

#### Validation
Inject `ConfigurationService` and log keys:
- `config.get('database.host')` → resolves to `"prod-db.hros.internal"` (Overridden by environment)
- `config.get('database.port')` → resolves to `5433` (Overridden by environment, type coerced to number)
- `config.get('database.username')` → resolves to `"postgres"` (Fallback to YAML)

---

### Scenario C: Fail-Fast Startup Validation

Attempt to start the service with missing or invalid environment variables.

#### Execution
```bash
# Set database port to a non-numeric string
export DATABASE_PORT="not-a-number"
# Clear the required JWT private key
export JWT_PRIVATE_KEY=""

# Run application bootstrap
npm run start
```

#### Expected Outcome
The NestJS bootstrap terminates immediately, and the following error traceback or structured message is printed to stderr:

```text
[Configuration] Validation failed:
- database.port: Expected number, received string "not-a-number"
- jwt.privateKey: Required configuration key is missing or empty
```
The process exits with status code `1` immediately.
