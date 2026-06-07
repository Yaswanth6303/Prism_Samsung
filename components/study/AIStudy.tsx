"use client";

import { NoteDetailPanel } from "@/components/study/NoteDetailPanel";
import { NotesPanel } from "@/components/study/NotesPanel";
import { QuizPanel } from "@/components/study/QuizPanel";
import { StudyHeader } from "@/components/study/StudyHeader";
import { SubjectsPanel } from "@/components/study/SubjectsPanel";
import { useStudyController } from "@/components/study/useStudyController";
import { WhiteboardPanel } from "@/components/study/WhiteboardPanel";

// ClawMind's study workspace orchestrates a state machine across five views.
// Each view is a panel; shared state and actions live in the useStudyController hook.
export function AIStudy() {
  const controller = useStudyController();
  const { view } = controller;

  if (view === "whiteboard") {
    return (
      <div className="w-full h-screen flex flex-col p-2 sm:p-4">
        <WhiteboardPanel controller={controller} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
      <StudyHeader controller={controller} />
      {view === "subjects" && <SubjectsPanel controller={controller} />}
      {view === "notes" && <NotesPanel controller={controller} />}
      {view === "noteDetail" && <NoteDetailPanel controller={controller} />}
      {view === "quiz" && <QuizPanel controller={controller} />}
    </div>
  );
}
