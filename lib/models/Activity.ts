import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'github' | 'leetcode' | 'gym' | 'jogging' | 'study' | 'project';
  title: string;
  date: Date;
  points: number;
  details?: string;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['github', 'leetcode', 'gym', 'jogging', 'study', 'project'],
      required: true,
    },
    title: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    points: { type: Number, required: true, default: 0 },
    details: { type: String },
  },
  { timestamps: true }
);

export const Activity: Model<IActivity> = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
