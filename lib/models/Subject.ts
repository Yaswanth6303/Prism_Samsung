import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INote {
  title: string;
  content?: string;
  createdDate: Date;
  hasQuiz: boolean;
}

export interface ISubject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  notesCount: number;
  notes: INote[];
}

const NoteSchema = new Schema<INote>({
  title: { type: String, required: true },
  content: { type: String },
  createdDate: { type: Date, default: Date.now },
  hasQuiz: { type: Boolean, default: false },
});

const SubjectSchema = new Schema<ISubject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    notesCount: { type: Number, default: 0 },
    notes: [NoteSchema],
  },
  { timestamps: true }
);

// Pre-save middleware to update notesCount
SubjectSchema.pre('save', async function () {
  if (this.notes) {
    this.notesCount = this.notes.length;
  }
});

export const Subject: Model<ISubject> = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
