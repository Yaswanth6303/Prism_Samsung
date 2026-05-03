import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IDailyActivityLog extends Document {
  userId: string
  date: string
  hasActivity: boolean
  totalCount: number
}

const DailyActivityLogSchema = new Schema<IDailyActivityLog>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    hasActivity: { type: Boolean, default: false },
    totalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

DailyActivityLogSchema.index({ userId: 1, date: 1 }, { unique: true })

export const DailyActivityLog: Model<IDailyActivityLog> =
  mongoose.models.DailyActivityLog || mongoose.model<IDailyActivityLog>('DailyActivityLog', DailyActivityLogSchema)