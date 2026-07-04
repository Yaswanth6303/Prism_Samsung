"use client";

import type { StudyController } from "@/components/study/useStudyController";

type QuizPanelProps = {
  controller: StudyController;
};

export function QuizPanel({ controller }: QuizPanelProps) {
  const { activeQuiz, quizLoading } = controller;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="font-semibold text-foreground mb-4">Practice Quiz</h2>
        {quizLoading && (
          <div className="py-10 text-center text-muted-foreground">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-muted-foreground" />
            Generating your quiz...
          </div>
        )}
        <div className="space-y-5">
          {activeQuiz.map((question, index) => (
            <div
              key={question.question}
              className="border border-border rounded-lg p-4"
            >
              <p className="font-medium text-foreground mb-3">
                {index + 1}. {question.question}
              </p>
              <div className="grid gap-2">
                {question.options.map((option) => (
                  <div
                    key={option}
                    className={`p-3 border rounded-lg ${
                      option === question.correctAnswer
                        ? "border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-700"
                        : "border-border"
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">{question.explanation}</p>
            </div>
          ))}
          {!quizLoading && activeQuiz.length === 0 && (
            <p className="text-muted-foreground">
              Generate a quiz from a note or use Practice Quiz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
