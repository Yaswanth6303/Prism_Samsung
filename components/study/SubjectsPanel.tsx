"use client";

import { useState } from "react";

import { BookOpen, ChevronRight, Plus } from "lucide-react";

import type { StudyController } from "@/components/study/useStudyController";

type SubjectsPanelProps = {
  controller: StudyController;
};

export function SubjectsPanel({ controller }: SubjectsPanelProps) {
  const { subjects, goToSubject, createSubject, loading } = controller;
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [subjectName, setSubjectName] = useState("");

  const handleCreate = async () => {
    const ok = await createSubject(subjectName);
    if (ok) {
      setSubjectName("");
      setShowNewSubject(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 id="tour-study-subjects" className="font-semibold text-foreground">
          Your Subjects
        </h2>
        <button
          id="tour-study-new-subject"
          onClick={() => setShowNewSubject(!showNewSubject)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Subject
        </button>
      </div>

      {showNewSubject && (
        <div className="bg-card rounded-xl border border-border p-4">
          <input
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            type="text"
            placeholder="Subject name"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewSubject(false)}
              className="px-4 py-2 border border-border text-foreground/80 rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {subjects.map((subject) => (
          <button
            type="button"
            key={subject.id}
            onClick={() => goToSubject(subject)}
            className="text-left bg-card rounded-2xl p-4 sm:p-5 border border-border hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 ${subject.color} rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}
              >
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{subject.name}</p>
                <p className="text-sm text-muted-foreground">{subject.notesCount} notes</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </div>
          </button>
        ))}
        {subjects.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 bg-card rounded-2xl p-8 border border-dashed border-border text-center text-muted-foreground">
            Create your first subject to start using ClawMind.
          </div>
        )}
      </div>
    </div>
  );
}
