"use client";

import { ArrowLeft } from "lucide-react";

import type { AIProvider, StudyController } from "@/components/study/useStudyController";

type StudyHeaderProps = {
  controller: StudyController;
};

export function StudyHeader({ controller }: StudyHeaderProps) {
  const {
    view,
    quizLoading,
    selectedSubject,
    selectedNote,
    provider,
    setProvider,
    goBack,
    status,
  } = controller;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        {view !== "subjects" && (
          <button
            onClick={goBack}
            disabled={view === "quiz" && quizLoading}
            className="p-2 hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/70" />
          </button>
        )}
        <h1 className="text-2xl font-semibold text-foreground">ClawMind</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">AI Model:</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            className="text-sm border border-border rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
          >
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {view === "subjects" && "Organize your study materials by subject"}
        {view === "notes" &&
          selectedSubject &&
          `${selectedSubject.name} - ${selectedSubject.notesCount} notes`}
        {view === "noteDetail" && selectedNote && selectedNote.title}
        {view === "quiz" && "Practice quiz"}
      </p>
      {status && (
        <p
          className={`text-sm mt-2 ${
            status.includes("saved") || status.includes("created")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}
