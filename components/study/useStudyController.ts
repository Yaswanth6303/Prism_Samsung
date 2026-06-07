"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api/fetch";
import {
  DirectoriesResponseSchema,
  DirectoryCreateResponseSchema,
  type Note,
  NoteCreateResponseSchema,
  NotesResponseSchema,
  OkOnlySchema,
  type QuizQuestion,
  QuizResponseSchema,
  type Subject,
  type SubjectWithNotes,
} from "@/types/api";

export type StudyView = "subjects" | "notes" | "noteDetail" | "quiz" | "whiteboard";
export type AIProvider = "openai" | "claude" | "gemini";

const QUIZ_COUNT = 8;

export function useStudyController() {
  const [view, setView] = useState<StudyView>("subjects");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithNotes | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await apiFetch("/api/ai/directories", DirectoriesResponseSchema);
      setSubjects(data.subjects);
    } catch {
      // silently keep stale state — caller may retry
    }
  }, []);

  // Loading notes also refreshes the subject in state so the note count stays truthful.
  const loadNotes = useCallback(async (subject: Subject) => {
    try {
      const data = await apiFetch(
        `/api/ai/notes?subjectId=${subject.id}`,
        NotesResponseSchema,
      );
      const withNotes: SubjectWithNotes = {
        ...subject,
        notes: data.notes,
        notesCount: data.notes.length,
      };
      setSelectedSubject(withNotes);
      setSubjects((current) =>
        current.map((item) =>
          item.id === withNotes.id ? { ...item, notesCount: withNotes.notesCount } : item,
        ),
      );
    } catch {
      // silently fail — notes panel will show empty state
    }
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  // Clicking a subject drills into its notes instead of jumping straight into the note editor.
  const goToSubject = useCallback(
    async (subject: Subject) => {
      setSelectedSubject(subject);
      setView("notes");
      await loadNotes(subject);
    },
    [loadNotes],
  );

  const goToNote = useCallback((note: Note) => {
    setSelectedNote(note);
    setView("noteDetail");
  }, []);

  // The back button behaves like a breadcrumb, unwinding the current view one level at a time.
  const goBack = useCallback(() => {
    if (view === "quiz" && quizLoading) {
      return;
    }
    if (view === "quiz") {
      setActiveQuiz([]);
      setView(selectedNote ? "noteDetail" : "notes");
    } else if (view === "whiteboard") {
      setView("notes");
    } else if (view === "noteDetail") {
      setView("notes");
      setSelectedNote(null);
    } else if (view === "notes") {
      setView("subjects");
      setSelectedSubject(null);
    }
  }, [view, quizLoading, selectedNote]);

  const goToWhiteboard = useCallback(() => {
    setView("whiteboard");
  }, []);

  const createSubject = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return false;
      }
      setLoading(true);
      setStatus("");
      try {
        await apiFetch("/api/ai/directories", DirectoryCreateResponseSchema, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        await loadSubjects();
        return true;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not create subject");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadSubjects],
  );

  const createNote = useCallback(
    async (input: { title: string; text: string }) => {
      if (!selectedSubject || !input.title.trim()) {
        return false;
      }
      setLoading(true);
      setStatus("");
      try {
        await apiFetch("/api/ai/notes", NoteCreateResponseSchema, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            subjectId: selectedSubject.id,
            title: input.title.trim(),
            text: input.text.trim() || input.title.trim(),
            provider,
          }),
        });
        await loadNotes(selectedSubject);
        return true;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not create note");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [selectedSubject, provider, loadNotes],
  );

  const deleteNote = useCallback(
    async (note: Note) => {
      if (!selectedSubject) {
        return;
      }
      setLoading(true);
      setStatus("");
      try {
        await apiFetch("/api/ai/notes", OkOnlySchema, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subjectId: selectedSubject.id, noteId: note.id }),
        });
        setSelectedNote(null);
        await loadNotes(selectedSubject);
        setView("notes");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not delete note");
      } finally {
        setLoading(false);
      }
    },
    [selectedSubject, loadNotes],
  );

  const generateQuiz = useCallback(async () => {
    if (!selectedNote) {
      return;
    }
    if (selectedNote.hasQuiz && selectedNote.quiz && selectedNote.quiz.length > 0) {
      setActiveQuiz(selectedNote.quiz);
      setView("quiz");
      return;
    }
    setLoading(true);
    setQuizLoading(true);
    setActiveQuiz([]);
    setView("quiz");
    setStatus("");
    try {
      const data = await apiFetch("/api/ai/quiz", QuizResponseSchema, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ noteId: selectedNote.id, provider, count: QUIZ_COUNT }),
      });
      const nextNote: Note = { ...selectedNote, hasQuiz: true, quiz: data.quiz.questions };
      setSelectedNote(nextNote);
      setActiveQuiz(data.quiz.questions);
      if (selectedSubject) {
        await loadNotes(selectedSubject);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create quiz");
    } finally {
      setLoading(false);
      setQuizLoading(false);
    }
  }, [selectedNote, provider, selectedSubject, loadNotes]);

  const generatePracticeQuiz = useCallback(async () => {
    if (!selectedSubject) {
      return;
    }
    const currentNotes = selectedSubject.notes ?? [];
    if (currentNotes.length === 0) {
      setStatus("Add a note first to generate a practice quiz.");
      return;
    }
    setLoading(true);
    setQuizLoading(true);
    setActiveQuiz([]);
    setView("quiz");
    setStatus("");
    try {
      const data = await apiFetch("/api/ai/quiz", QuizResponseSchema, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId: selectedSubject.id, provider, count: QUIZ_COUNT }),
      });
      setSelectedNote(null);
      setActiveQuiz(data.quiz.questions);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create quiz");
    } finally {
      setLoading(false);
      setQuizLoading(false);
    }
  }, [selectedSubject, provider]);

  return {
    // navigation state
    view,
    setView,
    selectedSubject,
    selectedNote,
    goToSubject,
    goToNote,
    goBack,
    goToWhiteboard,
    // subjects
    subjects,
    createSubject,
    // notes
    createNote,
    deleteNote,
    // quiz
    activeQuiz,
    quizLoading,
    generateQuiz,
    generatePracticeQuiz,
    // shared
    provider,
    setProvider,
    loading,
    status,
    setStatus,
  };
}

export type StudyController = ReturnType<typeof useStudyController>;
