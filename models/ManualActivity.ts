import mongoose, { Schema, Document } from 'mongoose'

export interface IManualActivity extends Document {
  userId: string
  type: 'gym' | 'jog' | 'custom'
  label: string
  value: number
  unit?: string
  date: string // "YYYY-MM-DD"
  pointsAwarded: number
}

const ManualActivitySchema = new Schema<IManualActivity>(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true, enum: ['gym', 'jog', 'custom'] },
    label: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String },
    date: { type: String, required: true },
    pointsAwarded: { type: Number, required: true },
  },
  { timestamps: true }
)

const ManualActivity =
  (mongoose.models.ManualActivity as mongoose.Model<IManualActivity>) ||
  mongoose.model<IManualActivity>('ManualActivity', ManualActivitySchema)

export default ManualActivity
