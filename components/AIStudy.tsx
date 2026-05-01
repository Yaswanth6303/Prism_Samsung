"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen, BrainCircuit, Pencil, ChevronRight, ArrowLeft, FileText } from "lucide-react";

type QuizQuestion = {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

type Note = {
  id: string
  subjectId: string
  title: string
  content: string
  createdDate: string
  hasQuiz: boolean
  quiz?: QuizQuestion[]
}

type Subject = {
  id: string
  name: string
  color: string
  notesCount: number
  notes?: Note[]
}

export function AIStudy() {
  const [view, setView] = useState<'subjects' | 'notes' | 'noteDetail' | 'quiz' | 'whiteboard'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function loadSubjects() {
    const response = await fetch('/api/ai/directories');
    if (!response.ok) return;
    const json = await response.json();
    if (json?.ok && Array.isArray(json.subjects || json.directories)) {
      setSubjects(json.subjects || json.directories);
    }
  }

  async function loadNotes(subject: Subject) {
    const response = await fetch(`/api/ai/notes?subjectId=${subject.id}`);
    if (!response.ok) return;
    const json = await response.json();
    if (json?.ok && Array.isArray(json.notes)) {
      const nextSubject = { ...subject, notes: json.notes, notesCount: json.notes.length };
      setSelectedSubject(nextSubject);
      setSubjects((current) => current.map((item) => item.id === nextSubject.id ? nextSubject : item));
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadSubjects();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject);
    setView('notes');
    await loadNotes(subject);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setView('noteDetail');
  };

  const handleBack = () => {
    if (view === 'quiz') {
      setView(selectedNote ? 'noteDetail' : 'notes');
    } else if (view === 'whiteboard') {
      setView('notes');
    } else if (view === 'noteDetail') {
      setView('notes');
      setSelectedNote(null);
    } else if (view === 'notes') {
      setView('subjects');
      setSelectedSubject(null);
    }
  };

  async function createSubject() {
    if (!subjectName.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/ai/directories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: subjectName.trim() }),
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Could not create subject');
      setSubjectName('');
      setShowNewSubject(false);
      await loadSubjects();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create subject');
    } finally {
      setLoading(false);
    }
  }

  async function createNote() {
    if (!selectedSubject || !noteTitle.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/ai/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject.id, title: noteTitle.trim(), text: noteText.trim() || noteTitle.trim() }),
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Could not create note');
      setNoteTitle('');
      setNoteText('');
      setShowNewNote(false);
      await loadNotes(selectedSubject);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create note');
    } finally {
      setLoading(false);
    }
  }

  async function generateQuiz() {
    if (!selectedNote) return;
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ noteId: selectedNote.id }),
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Could not create quiz');
      const nextNote = { ...selectedNote, hasQuiz: true, quiz: json.quiz.questions };
      setSelectedNote(nextNote);
      setView('quiz');
      if (selectedSubject) await loadNotes(selectedSubject);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create quiz');
    } finally {
      setLoading(false);
    }
  }

  const notes = selectedSubject?.notes ?? [];
  const quizQuestions = selectedNote?.quiz ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {view !== 'subjects' && (
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <h1 className="text-2xl font-semibold text-gray-900">ClawMind</h1>
        </div>
        <p className="text-sm text-gray-500">
          {view === 'subjects' && 'Organize your study materials by subject'}
          {view === 'notes' && selectedSubject && `${selectedSubject.name} - ${selectedSubject.notesCount} notes`}
          {view === 'noteDetail' && selectedNote && selectedNote.title}
          {view === 'quiz' && 'Practice quiz'}
          {view === 'whiteboard' && 'Whiteboard'}
        </p>
        {status && <p className="text-sm text-red-600 mt-2">{status}</p>}
      </div>

      {view === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Your Subjects</h2>
            <button onClick={() => setShowNewSubject(!showNewSubject)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Subject
            </button>
          </div>

          {showNewSubject && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} type="text" placeholder="Subject name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3" />
              <div className="flex gap-2">
                <button onClick={createSubject} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">Create</button>
                <button onClick={() => setShowNewSubject(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {subjects.map((subject) => (
              <div key={subject.id} onClick={() => handleSubjectClick(subject)} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${subject.color} rounded-lg flex items-center justify-center`}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{subject.name}</p>
                    <p className="text-sm text-gray-500">{subject.notesCount} notes</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
            {subjects.length === 0 && <div className="bg-white rounded-xl p-6 border border-dashed border-gray-300 text-center text-gray-500">Create your first subject to start using ClawMind.</div>}
          </div>
        </div>
      )}

      {view === 'notes' && selectedSubject && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Notes</h2>
            <button onClick={() => setShowNewNote(!showNewNote)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>

          {showNewNote && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} type="text" placeholder="Note title" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3" />
              <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Paste text, syllabus points, or a topic for ClawMind to turn into notes" className="w-full min-h-28 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3" />
              <div className="flex gap-2">
                <button onClick={createNote} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">Generate</button>
                <button onClick={() => setShowNewNote(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {notes.map((note) => (
              <div key={note.id} onClick={() => handleNoteClick(note)} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{note.title}</p>
                    <p className="text-sm text-gray-500 truncate">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">Created {note.createdDate || 'today'}</p>
                  </div>
                  {note.hasQuiz && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Has Quiz</span>}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
            {notes.length === 0 && <div className="bg-white rounded-xl p-6 border border-dashed border-gray-300 text-center text-gray-500">Generate a note to fill this subject.</div>}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => selectedNote ? setView('quiz') : setStatus('Open a note before starting a quiz.')} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition-colors text-left">
              <BrainCircuit className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Practice Quiz</p>
              <p className="text-sm text-gray-500">Test your knowledge</p>
            </button>
            <button onClick={() => setView('whiteboard')} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors text-left">
              <Pencil className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Whiteboard</p>
              <p className="text-sm text-gray-500">Draw diagrams</p>
            </button>
          </div>
        </div>
      )}

      {view === 'noteDetail' && selectedNote && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedNote.title}</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{selectedNote.content}</div>
            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
              <button onClick={generateQuiz} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {selectedNote.hasQuiz ? 'Open Quiz' : 'Generate Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'quiz' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">Practice Quiz</h2>
            <div className="space-y-5">
              {quizQuestions.map((question, index) => (
                <div key={question.question} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-3">{index + 1}. {question.question}</p>
                  <div className="grid gap-2">
                    {question.options.map((option) => (
                      <div key={option} className={`p-3 border rounded-lg ${option === question.correctAnswer ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>{option}</div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-3">{question.explanation}</p>
                </div>
              ))}
              {quizQuestions.length === 0 && <p className="text-gray-500">Generate a quiz from a note first.</p>}
            </div>
          </div>
        </div>
      )}

      {view === 'whiteboard' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-200 flex items-center gap-2">
              <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded"><ArrowLeft className="w-4 h-4" /></button>
              <Pencil className="w-4 h-4 text-gray-700" />
              <div className="flex gap-1">
                {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'].map((color) => <button key={color} className="w-6 h-6 rounded border-2 border-gray-300" style={{ backgroundColor: color }} />)}
              </div>
            </div>
            <div className="bg-white" style={{ height: '400px' }}>
              <canvas className="w-full h-full cursor-crosshair" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
