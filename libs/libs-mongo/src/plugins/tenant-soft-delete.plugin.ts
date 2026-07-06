import { Schema } from 'mongoose';
import { RequestContextService } from '@new-hros/libs-core';

export function tenantSoftDeletePlugin(schema: Schema) {
  schema.add({
    tenantCode: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    version: { type: Number, default: 1 },
    createdBy: { type: String },
    updatedBy: { type: String },
  });

  const applyTenantScope = function (this: any) {
    const filter = this.getFilter();
    const tenantCode = RequestContextService.getTenantCode();

    if (tenantCode) {
      filter.tenantCode = tenantCode;
    }
    if (filter.isDeleted === undefined) {
      filter.isDeleted = false;
    }
  };

  schema.pre('find', applyTenantScope);
  schema.pre('findOne', applyTenantScope);
  schema.pre('countDocuments', applyTenantScope);
  schema.pre('updateOne', applyTenantScope);
  schema.pre('updateMany', applyTenantScope);
  schema.pre('findOneAndUpdate', applyTenantScope);

  schema.pre('save', function (next) {
    const tenantCode = RequestContextService.getTenantCode();
    if (tenantCode && !this.tenantCode) {
      this.tenantCode = tenantCode;
    }

    const user = RequestContextService.getUser();
    if (user) {
      if (this.isNew) {
        this.createdBy = user.userId;
      }
      this.updatedBy = user.userId;
    }
    this.updatedAt = new Date();
    next();
  });
}
