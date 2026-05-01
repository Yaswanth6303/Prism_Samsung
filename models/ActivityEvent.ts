import mongoose, { Schema, Document } from 'mongoose'

export interface IActivityEvent extends Document {
  userId: string
  platform: 'manual' | 'github' | 'leetcode' | 'ai'
  type: string
  title: string
  subtitle?: string
  metadata?: mongoose.Schema.Types.Mixed
  pointsAwarded: number
}

const ActivityEventSchema = new Schema<IActivityEvent>(
  {
    userId: { type: String, required: true, index: true },
    platform: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    metadata: { type: Schema.Types.Mixed },
    pointsAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const ActivityEvent =
  (mongoose.models.ActivityEvent as mongoose.Model<IActivityEvent>) ||
  mongoose.model<IActivityEvent>('ActivityEvent', ActivityEventSchema)

export default ActivityEvent
