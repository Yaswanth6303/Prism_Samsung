import mongoose, { Schema, Document } from 'mongoose'

export interface IDailyActivityLog extends Document {
  userId: string
  date: string // "YYYY-MM-DD"
  hasActivity: boolean
  totalCount: number
}

const DailyActivityLogSchema = new Schema<IDailyActivityLog>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    hasActivity: { type: Boolean, default: false },
    totalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

DailyActivityLogSchema.index({ userId: 1, date: 1 }, { unique: true })

const DailyActivityLog =
  (mongoose.models.DailyActivityLog as mongoose.Model<IDailyActivityLog>) ||
  mongoose.model<IDailyActivityLog>('DailyActivityLog', DailyActivityLogSchema)

export default DailyActivityLog
