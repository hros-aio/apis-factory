import { Document } from 'mongoose';

export class BaseDocument extends Document {
  tenantCode!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
  isDeleted!: boolean;
  version!: number;
  createdBy?: string;
  updatedBy?: string;
}
