export enum TableName {
  Company = 'companies',
  Location = 'locations',
  Department = 'departments',
  Grade = 'grades',
  JobTitle = 'job_titles',
  OutboxEvent = 'outbox_events',
  Employee = 'employees',
}

export enum CompanyStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

export enum MasterDataStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  INTERN = 'INTERN',
}

export enum EmployeeStatus {
  ONBOARDING = "ONBOARDING",
  PROBATION = "PROBATION",
  ACTIVE = "ACTIVE",
  ON_LEAVE = "ON_LEAVE",
  SUSPENDED = "SUSPENDED",
  NOTICE_PERIOD = "NOTICE_PERIOD",
  RESIGNED = "RESIGNED",
  TERMINATED = "TERMINATED",
  RETIRED = "RETIRED",
}