import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  admin: mongoose.Types.ObjectId;
  action: string;
  details: string;
  targetUser?: mongoose.Types.ObjectId;
  targetTransaction?: mongoose.Types.ObjectId;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    targetTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
