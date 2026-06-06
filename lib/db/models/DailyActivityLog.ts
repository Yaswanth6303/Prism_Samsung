import mongoose, { Document, Model, Schema } from 'mongoose'

// Daily logs summarize whether a user was active on a given calendar day.
export interface IDailyActivityLog extends Document {
  userId: string
  date: string
  hasActivity: boolean
  totalCount: number
}

// One row per user per day keeps streak math and heatmap data straightforward.
const DailyActivityLogSchema = new Schema<IDailyActivityLog>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    hasActivity: { type: Boolean, default: false },
    totalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Enforce one log per day so sync and manual activity updates never create duplicates.
DailyActivityLogSchema.index({ userId: 1, date: 1 }, { unique: true })

export const DailyActivityLog: Model<IDailyActivityLog> =
  mongoose.models.DailyActivityLog || mongoose.model<IDailyActivityLog>('DailyActivityLog', DailyActivityLogSchema)