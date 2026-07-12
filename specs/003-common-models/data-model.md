# Data Model Design: Common SQL Models

This document outlines the schema layout, field constraints, relationships, and validations for the common SQL entities defined in `libs-sql`.

## 1. Entity Relationship Diagram (Conceptual)

```mermaid
erDiagram
    BaseEntity {
        uuid id PK
        varchar tenantCode
        timestamptz createdAt
        timestamptz updatedAt
        timestamptz deletedAt
        boolean isDeleted
        int version
        string createdBy
        string updatedBy
    }

    Company ||--o{ Company : "subsidiaries / holding"
    Company ||--o{ Department : "has"
    Company ||--o{ Location : "has"
    Company ||--o{ Grade : "has"
    Company ||--o{ JobTitle : "has"

    Department ||--o{ Department : "subDepartments / parent"
    Department ||--o{ JobTitle : "has"

    Grade ||--o{ JobTitle : "has"

    Company {
        varchar name
        varchar status
        varchar legalName
        varchar registrationNo
        varchar taxId
        varchar website
        varchar industry
        int size
        varchar logo
        date foundedDate
        uuid holdingId FK
        string contactName
        string contactEmail
        string contactPhone
        string contactTitle
        string secondaryContactName
        string secondaryContactEmail
        string secondaryContactPhone
        string secondaryContactTitle
    }

    Department {
        uuid companyId FK
        varchar code
        varchar name
        boolean isDivision
        uuid parentId FK
    }

    Location {
        uuid companyId FK
        varchar name
        varchar addressLine
        varchar city
        varchar state
        varchar country
        varchar zipCode
        varchar timezone
        string contactName
        string contactEmail
        string contactPhone
        string contactTitle
        varchar mapUrl
        boolean isHeadquarter
        bigint regionCoverMeters
    }

    Grade {
        uuid companyId FK
        varchar code
        varchar name
    }

    JobTitle {
        uuid companyId FK
        uuid departmentId FK
        uuid gradeId FK
        varchar code
        varchar name
    }

    BaseEntity <|-- Company : "extends"
    BaseEntity <|-- Department : "extends"
    BaseEntity <|-- Location : "extends"
    BaseEntity <|-- Grade : "extends"
    BaseEntity <|-- JobTitle : "extends"
```

---

## 2. Table Schemas & TypeORM Mappings

All models extend the abstract `BaseEntity` which provides `id`, `tenantCode` (mapped to `tenant_code` in the DB), `createdAt`, `updatedAt`, `deletedAt`, `isDeleted`, `version`, `createdBy`, and `updatedBy`.

### 2.1. Company Entity

- **Table Name**: `company`
- **Fields**:
  - `name`: `varchar(255)`, not null.
  - `status`: `varchar(32)`, not null, default `'pending'`. Must validate against values: `'pending'`, `'active'`, `'inactive'`.
  - `legalName`: `varchar(255)`, not null, column name `legal_name`.
  - `registrationNo`: `varchar(100)`, not null, column name `registration_no`.
  - `taxId`: `varchar(100)`, not null, column name `tax_id`.
  - `website`: `varchar(255)`, not null.
  - `industry`: `varchar(64)`, not null.
  - `size`: `integer`, not null.
  - `logo`: `varchar(256)`, not null.
  - `foundedDate`: `date`, not null, column name `founded_date`.
  - `holdingId`: `uuid`, nullable, column name `holding_id`.
  - **Embedded Contact Fields** (prefix: `contact_`):
    - `contactName`: `varchar(255)`, nullable, column name `contact_name`.
    - `contactEmail`: `varchar(255)`, nullable, column name `contact_email`.
    - `contactPhone`: `varchar(64)`, nullable, column name `contact_phone`.
    - `contactTitle`: `varchar(255)`, nullable, column name `contact_title`.
  - **Embedded Secondary Contact Fields** (prefix: `secondary_contact_`):
    - `secondaryContactName`: `varchar(255)`, nullable, column name `secondary_contact_name`.
    - `secondaryContactEmail`: `varchar(255)`, nullable, column name `secondary_contact_email`.
    - `secondaryContactPhone`: `varchar(64)`, nullable, column name `secondary_contact_phone`.
    - `secondaryContactTitle`: `varchar(255)`, nullable, column name `secondary_contact_title`.
- **Relationships**:
  - `holding`: ManyToOne with `Company` (`holding_id`), nullable.
  - `subsidiaries`: OneToMany with `Company` (mapped by `holding`).
  - `departments`: OneToMany with `Department` (mapped by `company`).
  - `locations`: OneToMany with `Location` (mapped by `company`).
  - `grades`: OneToMany with `Grade` (mapped by `company`).

---

### 2.2. Department Entity

- **Table Name**: `department`
- **Fields**:
  - `companyId`: `uuid`, not null, column name `company_id`.
  - `code`: `varchar(64)`, not null.
  - `name`: `varchar(255)`, nullable.
  - `isDivision`: `boolean`, default `false`, column name `is_division`.
  - `parentId`: `uuid`, nullable, column name `parent_id`.
- **Relationships**:
  - `company`: ManyToOne with `Company`, not null (`company_id`).
  - `parent`: ManyToOne with `Department` (`parent_id`), nullable.
  - `subDepartments`: OneToMany with `Department` (mapped by `parent`).
  - `jobTitles`: OneToMany with `JobTitle` (mapped by `department`).

---

### 2.3. Location Entity

- **Table Name**: `location`
- **Fields**:
  - `companyId`: `uuid`, not null, column name `company_id`.
  - `name`: `varchar(64)`, not null.
  - `mapUrl`: `varchar(255)`, nullable, column name `map_url`.
  - `isHeadquarter`: `boolean`, default `false`, column name `is_headquarter`.
  - `regionCoverMeters`: `bigint` (parsed as number/string in JS), default `100`, column name `region_cover_meters`.
  - **Embedded Address Fields** (no prefix):
    - `addressLine`: `varchar(255)`, not null, column name `address_line`.
    - `city`: `varchar(255)`, not null.
    - `state`: `varchar(100)`, not null.
    - `country`: `varchar(100)`, not null.
    - `zipCode`: `varchar(64)`, not null, column name `zip_code`.
    - `timezone`: `varchar(64)`, not null.
  - **Embedded Contact Fields** (prefix: `contact_`):
    - `contactName`: `varchar(255)`, nullable, column name `contact_name`.
    - `contactEmail`: `varchar(255)`, nullable, column name `contact_email`.
    - `contactPhone`: `varchar(64)`, nullable, column name `contact_phone`.
    - `contactTitle`: `varchar(255)`, nullable, column name `contact_title`.
- **Relationships**:
  - `company`: ManyToOne with `Company`, not null (`company_id`).

---

### 2.4. Grade Entity

- **Table Name**: `grade`
- **Fields**:
  - `companyId`: `uuid`, not null, column name `company_id`.
  - `code`: `varchar(64)`, not null.
  - `name`: `varchar(255)`, nullable.
- **Relationships**:
  - `company`: ManyToOne with `Company`, not null (`company_id`).
  - `jobTitles`: OneToMany with `JobTitle` (mapped by `grade`).

---

### 2.5. JobTitle Entity

- **Table Name**: `job_title`
- **Fields**:
  - `companyId`: `uuid`, not null, column name `company_id`.
  - `departmentId`: `uuid`, not null, column name `department_id`.
  - `gradeId`: `uuid`, not null, column name `grade_id`.
  - `code`: `varchar(64)`, not null.
  - `name`: `varchar(255)`, nullable.
- **Relationships**:
  - `company`: ManyToOne with `Company`, not null (`company_id`).
  - `department`: ManyToOne with `Department`, not null (`department_id`).
  - `grade`: ManyToOne with `Grade`, not null (`grade_id`).

---

## 3. Data Integrity & Validation Rules

1. **Company Status Validation**:
   - Status must only accept values from the set: `['pending', 'active', 'inactive']`.
2. **Tenant Boundary Protection**:
   - Any association reference must be restricted to the same `tenantCode`.
3. **Optimistic Locking**:
   - Handled via TypeORM `@VersionColumn` which increments the version on every write.
4. **Soft Delete**:
   - Standard select queries must utilize TypeORM's built-in support for soft-deleting (`deleted_at` field automatically filtered out by TypeORM finders).
