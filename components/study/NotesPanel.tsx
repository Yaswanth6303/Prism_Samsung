"use client";

import { useState } from "react";

import { BrainCircuit, ChevronRight, FileText, Pencil, Plus } from "lucide-react";

import type { StudyController } from "@/components/study/useStudyController";

type NotesPanelProps = {
  controller: StudyController;
};

export function NotesPanel({ controller }: NotesPanelProps) {
  const {
    selectedSubject,
    createNote,
    goToNote,
    goToWhiteboard,
    generatePracticeQuiz,
    loading,
  } = controller;
  const [showNewNote, setShowNewNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  if (!selectedSubject) {return null;}
  const notes = selectedSubject.notes ?? [];

  const handleCreate = async () => {
    const ok = await createNote({ title: noteTitle, text: noteText });
    if (ok) {
      setNoteTitle("");
      setNoteText("");
      setShowNewNote(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground">Notes</h2>
        <button
          onClick={() => setShowNewNote(!showNewNote)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {showNewNote && (
        <div className="bg-card rounded-xl border border-border p-4">
          <input
            value={noteTitle}
            onChange={(event) => setNoteTitle(event.target.value)}
            type="text"
            placeholder="Note title"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          />
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Paste text, syllabus points, or a topic for ClawMind to turn into notes"
            className="w-full min-h-28 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              Generate
            </button>
            <button
              onClick={() => setShowNewNote(false)}
              className="px-4 py-2 border border-border text-foreground/80 rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {notes.map((note) => (
          <button
            type="button"
            key={note.id}
            onClick={() => goToNote(note)}
            className="text-left bg-card rounded-2xl p-5 border border-border hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-blue-100/60 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              {note.hasQuiz && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-100/60 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-full border border-purple-200 dark:border-purple-800">
                  <BrainCircuit className="w-3 h-3" />
                  Quiz Ready
                </span>
              )}
            </div>

            <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-1">
              {note.title}
            </h3>

            <div className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
              {note.content.replace(/[#*`]/g, "").slice(0, 150)}...
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
              <span className="text-xs text-muted-foreground font-medium">
                {note.createdDate || "Recently added"}
              </span>
              <div className="flex items-center text-blue-600 text-xs font-bold gap-1 group-hover:translate-x-1 transition-transform">
                View Full Note
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        ))}
        {notes.length === 0 && (
          <div className="sm:col-span-2 bg-muted/50 rounded-2xl p-12 border-2 border-dashed border-border text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              No notes yet. Start by generating one!
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={generatePracticeQuiz}
          className="p-4 bg-card border border-border rounded-xl hover:border-purple-300 transition-colors text-left"
        >
          <BrainCircuit className="w-6 h-6 text-purple-600 mb-2" />
          <p className="font-medium text-foreground">Practice Quiz</p>
          <p className="text-sm text-muted-foreground">Quiz across all notes</p>
        </button>
        <button
          onClick={goToWhiteboard}
          className="p-4 bg-card border border-border rounded-xl hover:border-blue-300 transition-colors text-left"
        >
          <Pencil className="w-6 h-6 text-blue-600 mb-2" />
          <p className="font-medium text-foreground">Whiteboard</p>
          <p className="text-sm text-muted-foreground">Draw diagrams</p>
        </button>
      </div>
    </div>
  );
}
