# Configuration Schema Data Models

This document outlines the structured schema representations and type definitions used for configuration validation and mapping.

---

## 1. Global Configuration Interface

The root configuration structure comprises multiple specialized sub-modules, which are deep-merged and validated at runtime.

### Configuration Model (`Configuration`)

| Attribute | Type | Description | Required | Validation Rules |
|---|---|---|---|---|
| `app` | `AppConfiguration` | Basic application settings | Yes | Validated by App Schema |
| `database` | `DatabaseConfiguration` | SQL/Postgres database credentials | Yes | Validated by Database Schema |
| `redis` | `RedisConfiguration` | Redis caching connection details | Yes | Validated by Redis Schema |
| `kafka` | `KafkaConfiguration` | Kafka message broker settings | Yes | Validated by Kafka Schema |
| `jwt` | `JwtConfiguration` | Token sign/verify credentials | Yes | Validated by JWT Schema |

---

## 2. Component Configurations

### App Configuration (`AppConfiguration`)

| Attribute | Type | Description | Default | Validation Rules |
|---|---|---|---|---|
| `name` | `string` | The microservice name | `api-service` | Non-empty, string |
| `port` | `number` | Port on which the application listens | `3000` | Integer, `1` to `65535` |
| `env` | `'production' \| 'development' \| 'test'` | Execution environment | `'development'` | String enum |

### Database Configuration (`DatabaseConfiguration`)

| Attribute | Type | Description | Default | Validation Rules |
|---|---|---|---|---|
| `host` | `string` | Database server hostname | `localhost` | Non-empty, string |
| `port` | `number` | Port for database server | `5432` | Integer, `1` to `65535` |
| `username` | `string` | Database user name | N/A | Non-empty, string |
| `password` | `string` | Database password | N/A | Non-empty, string |
| `name` | `string` | Database name | N/A | Optional string |

### Redis Configuration (`RedisConfiguration`)

| Attribute | Type | Description | Default | Validation Rules |
|---|---|---|---|---|
| `host` | `string` | Redis host | N/A | Non-empty, string |
| `port` | `number` | Redis port | `6379` | Integer, `1` to `65535` |

### Kafka Configuration (`KafkaConfiguration`)

| Attribute | Type | Description | Default | Validation Rules |
|---|---|---|---|---|
| `brokers` | `string[]` | Array of Kafka broker endpoints | N/A | Array of non-empty strings (at least 1 broker) |

### JWT Configuration (`JwtConfiguration`)

| Attribute | Type | Description | Default | Validation Rules |
|---|---|---|---|---|
| `publicKey` | `string` | JWT authentication public key | N/A | Non-empty, string |
| `privateKey` | `string` | JWT authentication private key | N/A | Non-empty, string |

---

## 3. Environment Variable Mapping Registry

The loader parses flat env keys to resolve them into nested paths using two strategies:
1. **Automatic Double Underscore Parsing**: Translates `SECTION__KEY` (e.g. `DATABASE__HOST`) into `section.key` (`database.host`).
2. **Standard Envs Fallback Registry**:
   - `APP_NAME` → `app.name`
   - `APP_PORT` → `app.port`
   - `NODE_ENV` → `app.env`
   - `DATABASE_HOST` → `database.host`
   - `DATABASE_PORT` → `database.port`
   - `DATABASE_USERNAME` → `database.username`
   - `DATABASE_PASSWORD` → `database.password`
   - `DATABASE_NAME` → `database.name`
   - `REDIS_HOST` → `redis.host`
   - `REDIS_PORT` → `redis.port`
   - `JWT_PUBLIC_KEY` → `jwt.publicKey`
   - `JWT_PRIVATE_KEY` → `jwt.privateKey`
   - `KAFKA_BROKERS` → `kafka.brokers` (parsed from comma-separated string)
