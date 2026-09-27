export enum TableName {
  Company = 'companies',
  Location = 'locations',
  Department = 'departments',
  Grade = 'grades',
  JobTitle = 'job_titles',
  OutboxEvent = 'outbox_events',
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
