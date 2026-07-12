# Public Interface Contracts: Common SQL Models

This document details the TypeScript class signatures and exported types that the `libs-sql` library exposes for the common models.

## 1. Exported Classes

All entities will reside in `libs/libs-sql/src/common/` and be exported from `libs/libs-sql/src/index.ts`.

### 1.1. `Company` Class Contract

```typescript
import { BaseEntity } from '../base.entity';
import { Department } from './department.entity';
import { Location } from './location.entity';
import { Grade } from './grade.entity';

export declare class Company extends BaseEntity {
  name: string;
  status: 'pending' | 'active' | 'inactive';
  legalName: string;
  registrationNo: string;
  taxId: string;
  website: string;
  industry: string;
  size: number;
  logo: string;
  foundedDate: Date;
  holdingId?: string | null;
  holding?: Company | null;
  subsidiaries?: Company[];
  
  // Contact (embedded)
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactTitle?: string | null;

  // Secondary Contact (embedded)
  secondaryContactName?: string | null;
  secondaryContactEmail?: string | null;
  secondaryContactPhone?: string | null;
  secondaryContactTitle?: string | null;

  departments?: Department[];
  locations?: Location[];
  grades?: Grade[];
}
```

---

### 1.2. `Department` Class Contract

```typescript
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { JobTitle } from './job-title.entity';

export declare class Department extends BaseEntity {
  companyId: string;
  company?: Company;
  code: string;
  name?: string | null;
  isDivision: boolean;
  parentId?: string | null;
  parent?: Department | null;
  subDepartments?: Department[];
  jobTitles?: JobTitle[];
}
```

---

### 1.3. `Location` Class Contract

```typescript
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';

export declare class Location extends BaseEntity {
  companyId: string;
  company?: Company;
  name: string;
  mapUrl?: string | null;
  isHeadquarter: boolean;
  regionCoverMeters: number;

  // Address (embedded)
  addressLine: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  timezone: string;

  // Contact (embedded)
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactTitle?: string | null;
}
```

---

### 1.4. `Grade` Class Contract

```typescript
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { JobTitle } from './job-title.entity';

export declare class Grade extends BaseEntity {
  companyId: string;
  company?: Company;
  code: string;
  name?: string | null;
  jobTitles?: JobTitle[];
}
```

---

### 1.5. `JobTitle` Class Contract

```typescript
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { Department } from './department.entity';
import { Grade } from './grade.entity';

export declare class JobTitle extends BaseEntity {
  companyId: string;
  company?: Company;
  departmentId: string;
  department?: Department;
  gradeId: string;
  grade?: Grade;
  code: string;
  name?: string | null;
}
```
