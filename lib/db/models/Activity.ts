import mongoose, { Document, Model, Schema } from 'mongoose';

// Activity records are the durable history of everything the user has done in the app.
export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'github' | 'leetcode' | 'gym' | 'jogging' | 'study' | 'project';
  title: string;
  date: Date;
  points: number;
  details?: string;
}

// Keep the schema strict so activity entries stay comparable across manual and synced sources.
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
