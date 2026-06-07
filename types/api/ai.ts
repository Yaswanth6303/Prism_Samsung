import { z } from "zod";

import { OkLiteral } from "./_shared";

export const AIProviderSchema = z.enum(["openai", "claude", "gemini"]);
export type AIProvider = z.infer<typeof AIProviderSchema>;

// Directories / Subjects ────────────────────────────────────────────────
// Wire shape: the directories endpoint returns only summary fields.
export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  notesCount: z.number(),
});
export type Subject = z.infer<typeof SubjectSchema>;

export const DirectoriesResponseSchema = z.object({
  ok: OkLiteral,
  directories: z.array(SubjectSchema),
  subjects: z.array(SubjectSchema),
});
export type DirectoriesResponse = z.infer<typeof DirectoriesResponseSchema>;

export const DirectoryCreateBodySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});
export type DirectoryCreateBody = z.infer<typeof DirectoryCreateBodySchema>;

export const DirectoryCreateResponseSchema = z.object({
  ok: OkLiteral,
  directory: SubjectSchema,
  subject: SubjectSchema,
});
export type DirectoryCreateResponse = z.infer<typeof DirectoryCreateResponseSchema>;

// Notes ─────────────────────────────────────────────────────────────────
export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const NoteSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  content: z.string(),
  createdDate: z.string(),
  hasQuiz: z.boolean(),
  quiz: z.array(QuizQuestionSchema).default([]),
});
export type Note = z.infer<typeof NoteSchema>;

export const NotesResponseSchema = z.object({
  ok: OkLiteral,
  notes: z.array(NoteSchema),
});
export type NotesResponse = z.infer<typeof NotesResponseSchema>;

// View-model: the study UI attaches the notes array onto the selected Subject in client state.
export type SubjectWithNotes = Subject & { notes?: Note[] };

export const NoteCreateBodySchema = z.object({
  subjectId: z.string().min(1),
  title: z.string().min(1),
  text: z.string().optional(),
  provider: AIProviderSchema.optional(),
});
export type NoteCreateBody = z.infer<typeof NoteCreateBodySchema>;

export const NoteCreateResponseSchema = z.object({
  ok: OkLiteral,
  note: NoteSchema,
});
export type NoteCreateResponse = z.infer<typeof NoteCreateResponseSchema>;

export const NoteDeleteBodySchema = z.object({
  subjectId: z.string().min(1),
  noteId: z.string().min(1),
});
export type NoteDeleteBody = z.infer<typeof NoteDeleteBodySchema>;

// Quiz ──────────────────────────────────────────────────────────────────
export const QuizGenerateBodySchema = z
  .object({
    noteId: z.string().optional(),
    subjectId: z.string().optional(),
    provider: AIProviderSchema.optional(),
    count: z.number().optional(),
  })
  .refine((data) => Boolean(data.noteId || data.subjectId), {
    message: "noteId or subjectId is required",
  });
export type QuizGenerateBody = z.infer<typeof QuizGenerateBodySchema>;

export const QuizResponseSchema = z.object({
  ok: OkLiteral,
  quiz: z.object({
    noteId: z.string().nullable(),
    questions: z.array(QuizQuestionSchema),
  }),
});
export type QuizResponse = z.infer<typeof QuizResponseSchema>;

// Whiteboards ───────────────────────────────────────────────────────────
export const WhiteboardSchema = z
  .object({
    _id: z.unknown().optional(),
    id: z.string().optional(),
    title: z.string().optional(),
    image: z.string(),
    createdDate: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();
export type Whiteboard = z.infer<typeof WhiteboardSchema>;

export const WhiteboardsResponseSchema = z.object({
  ok: OkLiteral,
  whiteboards: z.array(WhiteboardSchema),
});
export type WhiteboardsResponse = z.infer<typeof WhiteboardsResponseSchema>;

export const WhiteboardCreateBodySchema = z.object({
  subjectId: z.string().min(1),
  image: z.string().min(1),
  title: z.string().optional(),
});
export type WhiteboardCreateBody = z.infer<typeof WhiteboardCreateBodySchema>;

export const WhiteboardCreateResponseSchema = z.object({
  ok: OkLiteral,
  whiteboard: WhiteboardSchema,
  whiteboards: z.array(WhiteboardSchema),
});
export type WhiteboardCreateResponse = z.infer<typeof WhiteboardCreateResponseSchema>;

export const WhiteboardDeleteResponseSchema = z.object({
  ok: OkLiteral,
  whiteboards: z.array(WhiteboardSchema),
  debug: z
    .object({
      matched: z.number().optional(),
      modified: z.number().optional(),
      removed: z.number().optional(),
    })
    .optional(),
});
export type WhiteboardDeleteResponse = z.infer<typeof WhiteboardDeleteResponseSchema>;

// ClawMind: thin AI assistant wrapper.
export const ClawMindBodySchema = z.object({
  message: z.string().min(1),
});
export type ClawMindBody = z.infer<typeof ClawMindBodySchema>;

export const ClawMindResponseSchema = z.object({
  ok: OkLiteral,
  reply: z.string(),
});
export type ClawMindResponse = z.infer<typeof ClawMindResponseSchema>;
