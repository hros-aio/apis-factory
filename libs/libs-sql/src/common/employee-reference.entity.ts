import { Check, Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../base.entity";
import { EmployeeStatus, EmploymentType, TableName } from "./enums";

export class EmployeeProfile {
  firstName: string;
  middlename?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: Date;
  workEmail: string;
  gender?: string;
  avatarUrl?: string;
  personalEmail?: string;
  personalPhone?: string;
  address?: Record<string, unknown>;
}

@Entity(TableName.Employee)
@Index('idx_employees_tenant_employee_code', ['tenantCode', 'employeeCode'])
@Index('idx_employees_tenant_id', ['tenantCode', 'id'])
@Index('idx_employees_tenant_status', ['tenantCode', 'status'])
export class EmployeeReference extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: false })
  companyId: string;

  @Column({ name: 'location_id', type: 'uuid', nullable: false })
  locationId: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: false })
  departmentId: string;

  @Column({ name: 'job_title_id', type: 'uuid', nullable: false })
  jobTitleId: string;

  @Column({ name: 'grade_id', type: 'uuid', nullable: false })
  gradeId: string;

  @Column({ name: 'manager_employee_id', type: 'uuid', nullable: false })
  managerEmployeeId: string;

  @Column({ name: 'status', type: 'varchar', length: 32, nullable: false })
  status: EmployeeStatus;

  @Column({ name: 'employment_type', type: 'varchar', length: 32, nullable: false })
  employmentType: EmploymentType;

  @Column({ name: 'employee_code', type: 'varchar', length: 64, nullable: false })
  employeeCode: string;

  @Column({ name: 'profile', type: 'jsonb', default: '{}' })
  profile: EmployeeProfile;
}