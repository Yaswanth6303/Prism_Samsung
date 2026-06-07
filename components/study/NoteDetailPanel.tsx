"use client";

import { Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { StudyController } from "@/components/study/useStudyController";

type NoteDetailPanelProps = {
  controller: StudyController;
};

export function NoteDetailPanel({ controller }: NoteDetailPanelProps) {
  const { selectedNote, generateQuiz, deleteNote, loading } = controller;
  if (!selectedNote) {return null;}

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">{selectedNote.title}</h2>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              Created: {selectedNote.createdDate}
            </div>
            <button
              onClick={() => deleteNote(selectedNote)}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNote.content}</ReactMarkdown>
        </div>
        <div className="mt-6 pt-4 border-t border-border flex gap-3">
          <button
            onClick={generateQuiz}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {selectedNote.hasQuiz ? "Open Quiz" : "Generate Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
