import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INote {
  _id?: mongoose.Types.ObjectId;
  title: string;
  content?: string;
  createdDate: Date;
  hasQuiz: boolean;
  quiz?: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export interface IWhiteboard {
  _id?: mongoose.Types.ObjectId;
  title?: string;
  image: string;
  createdDate: Date;
}

export interface ISubject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  notesCount: number;
  notes: INote[];
  whiteboards: IWhiteboard[];
}

const NoteSchema = new Schema<INote>({
  title: { type: String, required: true },
  content: { type: String },
  createdDate: { type: Date, default: Date.now },
  hasQuiz: { type: Boolean, default: false },
  quiz: [
    {
      question: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctAnswer: { type: String, required: true },
      explanation: { type: String, required: true },
    },
  ],
});

const WhiteboardSchema = new Schema<IWhiteboard>({
  title: { type: String },
  image: { type: String, required: true },
  createdDate: { type: Date, default: Date.now },
});

const SubjectSchema = new Schema<ISubject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    notesCount: { type: Number, default: 0 },
    notes: [NoteSchema],
    whiteboards: { type: [WhiteboardSchema], default: [] },
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
