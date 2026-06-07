"use client";

import { ArrowLeft } from "lucide-react";
import { Tldraw } from "tldraw";

import "tldraw/tldraw.css";
import type { StudyController } from "@/components/study/useStudyController";

type WhiteboardPanelProps = {
  controller: StudyController;
};

export function WhiteboardPanel({ controller }: WhiteboardPanelProps) {
  const { goBack } = controller;

  return (
    <>
      <button onClick={goBack} className="p-2 hover:bg-muted rounded-lg w-fit">
        <ArrowLeft className="w-5 h-5 text-foreground/70" />
      </button>
      <div className="flex-1 flex items-start justify-center pt-4">
        <div className="w-full max-w-2xl sm:max-w-4xl lg:max-w-6xl h-5/6 rounded-lg border border-border overflow-hidden shadow-lg">
          <Tldraw licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY} />
        </div>
      </div>
    </>
  );
}
