# Feature Specification: Common SQL Models

**Feature Branch**: `003-common-models`

**Created**: 2026-07-09

**Status**: Ready

**Input**: User description: "In libs-sql, create folder common for the common models will be reuse in many service, among: 'Company', 'Location', 'Department', 'JobTile' based on my sql..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Tenant Company Management (Priority: P1)

As a System Administrator or Tenant Owner, I want to create and manage the primary Company entity for my tenant, including contact details and corporate parent relations.

**Why this priority**: Fundamental entity that anchors all other organizational data (departments, locations, employees).

**Independent Test**: A tenant can register a new company profile with necessary legal/contact details, and retrieve/update it.

**Acceptance Scenarios**:

1. **Given** a tenant has a unique tenant ID, **When** they register their company with required legal details (legal name, registration number, tax ID, founded date, website, size, industry, logo), **Then** a Company record is created and linked to that tenant ID.
2. **Given** a Company exists, **When** another Company is created with it as the `holding_id`, **Then** a parent-subsidiary corporate hierarchy is formed.

---

### User Story 2 - Departmental Hierarchy Configuration (Priority: P2)

As a Tenant Administrator, I want to define Departments within my Company and structure them hierarchically (with divisions and sub-departments).

**Why this priority**: Essential for mapping the organizational structure and reporting lines.

**Independent Test**: A tenant can define a department, designate if it is a division, and set a parent department under their company.

**Acceptance Scenarios**:

1. **Given** a valid Company and tenant ID, **When** a Department is created with a unique code, **Then** it is successfully associated with that Company.
2. **Given** an existing Department, **When** a new Department is created with the existing one as its parent, **Then** a parent-child relationship is successfully established.

---

### User Story 3 - Multi-Site Location Management (Priority: P3)

As a Tenant Administrator, I want to configure physical Locations (e.g. Headquarters, regional branches) for my Company with addresses and contact info.

**Why this priority**: Crucial for attendance tracking, local compliance, and work site allocation.

**Independent Test**: A tenant can create a location, specify if it is a headquarter, and assign address/geographic coverage details.

**Acceptance Scenarios**:

1. **Given** a Company, **When** a Location is created with a full address (line, city, state, country, zip code), timezone, and headquarter flag, **Then** it is successfully saved and linked to the Company.

---

### User Story 4 - Job Title Definition and Grading (Priority: P3)

As an HR Manager, I want to define Job Titles associated with specific Departments and Grades to organize roles and compensation bands.

**Why this priority**: Essential for payroll, job assignments, and employee records.

**Independent Test**: A user can define a job title and link it to a company, department, and grade.

**Acceptance Scenarios**:

1. **Given** a Company, Department, and Grade, **When** a Job Title is created with a unique code, **Then** it is successfully associated with all three entities.

---

### Edge Cases

- **Circular Hierarchy**: What happens when a Department or Company references itself as its parent/holding entity? The system must reject circular references.
- **Cross-Tenant Associations**: How does the system handle an attempt to associate a Department or Location belonging to Tenant A with a Company belonging to Tenant B? Associations must be restricted to the same tenant.
- **Orphaned Child Records on Soft Delete**: When a parent entity (e.g., Company) is soft-deleted, database-level cascade soft-delete is not enforced. The application/business logic is responsible for ensuring orphaned records are managed or validated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: **Multi-Tenant Separation**: All common SQL entities (Company, Department, Location, Grade, JobTitle) MUST be isolated by `tenant_id` (which maps to the base entity's tenant code property).
- **FR-002**: **Primary Identification**: All entities MUST use UUID as their primary key.
- **FR-003**: **Soft Deletion**: All entities MUST support soft-deletion (retaining records with a deletion timestamp) to prevent permanent loss of historical data.
- **FR-004**: **Recursive Hierarchies**:
  - `Company` MUST support a parent-subsidiary relationship via an optional `holding_id` self-reference.
  - `Department` MUST support a parent-subdepartment relationship via an optional `parent_id` self-reference.
- **FR-005**: **Embeddable Contacts & Address**:
  - `Company` and `Location` MUST support embedded primary contact details (name, email, phone, title).
  - `Company` MUST also support a secondary contact.
  - `Location` MUST support embedded address information (address line, city, state, country, zip code, timezone).
- **FR-006**: **Job Title References**: `JobTitle` MUST link to exactly one `Company`, `Department`, and `Grade` entity.
- **FR-007**: **Company Status Validation**: System MUST restrict Company status to a predefined set of values: `'pending'`, `'active'`, `'inactive'`.
- **FR-008**: **Soft Delete Cascading Policy**: All entities MUST support independent soft delete. Cascading soft deletes or validation rules preventing deletion of entities with active children are handled by application/business logic, keeping database-level models simple.

### Key Entities *(include if feature involves data)*

- **Company**: Represents a legal corporate entity under a specific tenant. Attributes include name, status, legal details (registration, tax id, website, industry, size, logo, founded date), contact details (primary and secondary), and optional parent company reference (`holding_id`).
- **Department**: Represents an organizational unit within a company. Attributes include code, name, division flag (`is_division`), and optional parent department reference (`parent_id`).
- **Location**: Represents a physical address/workspace of a company. Attributes include name, timezone, map URL, headquarter flag (`is_headquarter`), region coverage in meters, contact details, and address details.
- **Grade**: Represents a job grading level (e.g. salary bands or ranks) within a company. Attributes include code and name.
- **JobTitle**: Represents a job role or position. Attributes include code, name, and associations with Company, Department, and Grade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Microservices can import and utilize the Company, Location, Department, Grade, and JobTitle entities from the common folder in `libs-sql` without schema duplication.
- **SC-002**: Database queries on these common models enforce strict tenant separation, returning 0 records from other tenants.
- **SC-003**: 100% of the common models successfully soft delete, and standard queries filter out soft-deleted records by default.
- **SC-004**: Multi-level organizational hierarchies (holding/subsidiary companies, parent/sub-departments) are fully traversable.

## Assumptions

- The base database configuration uses PostgreSQL as the underlying database engine.
- All entities will inherit common audit fields (created_at, updated_at, deleted_at, created_by, updated_by, version, tenantCode) from the existing `BaseEntity` in `libs-sql`.
- Soft delete functionality is supported by the underlying base repository or ORM.
- The `tenant_id` from GORM SQL mapping will map to `tenantCode` in the existing `BaseEntity`.
- Grade is required as a key entity since `JobTitle` depends on it.
