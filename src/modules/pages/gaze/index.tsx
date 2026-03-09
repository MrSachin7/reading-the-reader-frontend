"use client";

import { LiveGazeOverlay } from "@/modules/pages/gaze/components/LiveGazeOverlay";

export default function GazePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,120,160,0.16),rgba(0,0,0,0.94)_45%)]" />
      <LiveGazeOverlay statusVariant="panel" />
    </main>
  );
}

