"use client"

import * as React from "react"
import { AlertTriangle, CircleDot, Expand, Eye, Signal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type {
  CalibrationPointDefinition,
  CalibrationTargetPhase,
  CalibrationWorkspacePhase,
} from "./utils"

type CalibrationStageProps = {
  phase: CalibrationWorkspacePhase
  isFullscreen: boolean
  isVisible: boolean
  connectionStatus: string
  hasRecentLiveGaze: boolean
  sampleRateHz: number
  activeTarget: CalibrationPointDefinition | null
  activePointIndex: number
  totalPoints: number
  targetPhase: CalibrationTargetPhase
  stageRef: React.RefObject<HTMLDivElement | null>
  gazeMarkerRef: React.RefObject<HTMLDivElement | null>
  onRequestFullscreen: () => void
  onStartCalibration: () => void
  onClose: () => void
}

function ReadinessStatus({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "good" | "warn" | "neutral"
}) {
  const toneClassName =
    tone === "good"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : tone === "warn"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
        : "border-white/10 bg-white/5 text-slate-200"

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClassName}`}>
      <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  )
}

export function CalibrationStage({
  phase,
  isFullscreen,
  isVisible,
  connectionStatus,
  hasRecentLiveGaze,
  sampleRateHz,
  activeTarget,
  activePointIndex,
  totalPoints,
  targetPhase,
  stageRef,
  gazeMarkerRef,
  onRequestFullscreen,
  onStartCalibration,
  onClose,
}: CalibrationStageProps) {
  const canStart = isFullscreen && isVisible && connectionStatus === "open" && hasRecentLiveGaze
  const isRunning = phase === "running"
  const readinessMessage = !isFullscreen
    ? "Enter full screen before starting."
    : !isVisible
      ? "Return to this tab."
      : connectionStatus !== "open"
        ? "Waiting for websocket connection."
        : !hasRecentLiveGaze
          ? "Look at the center dot until tracking is ready."
          : "Tracking looks good. You can start now."

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.2),rgba(2,6,23,0.98)_52%)] text-white">
      <div
        ref={stageRef}
        className="absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:12%_12%]" />
        <div
          ref={gazeMarkerRef}
          className={`pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/80 bg-cyan-400/40 shadow-[0_0_34px_rgba(34,211,238,0.9)] ${isRunning ? "opacity-0" : "transition-opacity"}`}
          aria-hidden="true"
        />

        <div
          className={`pointer-events-none absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-white/10 shadow-[0_0_90px_rgba(255,255,255,0.28)] transition-[left,top,transform] duration-700 ease-out ${isRunning && targetPhase === "capture" ? "scale-75" : "scale-100"}`}
          style={{
            left: `${(activeTarget?.x ?? 0.5) * 100}%`,
            top: `${(activeTarget?.y ?? 0.5) * 100}%`,
          }}
        >
          <div className="absolute inset-4 rounded-full border border-cyan-200/80 bg-cyan-300/65" />
          <div className="absolute inset-[36px] rounded-full bg-slate-950/90" />
        </div>
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
            {isRunning ? "Calibration running" : "Readiness check"}
          </span>
          {isRunning ? (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-200">
              Point {activePointIndex + 1} / {totalPoints}
            </span>
          ) : null}
        </div>

        <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
          Exit
        </Button>
      </header>

      {isRunning ? (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 pb-10 pt-24 lg:px-10">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">
              Keep your gaze on the dot
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-6xl">
              Hold still until it moves.
            </h1>
            <p className="mt-4 text-base text-slate-300 lg:text-lg">
              Do not chase the dot with your head. Let only your eyes follow it.
            </p>
          </div>

          <div className="flex gap-2">
            {Array.from({ length: totalPoints }).map((_, index) => (
              <span
                key={index}
                className={`h-2.5 rounded-full transition-all ${
                  index < activePointIndex
                    ? "w-10 bg-cyan-300"
                    : index === activePointIndex
                      ? "w-16 bg-white"
                      : "w-10 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 pb-10 pt-20 lg:px-10">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Readiness</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-balance lg:text-6xl">
              Look at the center dot until the system says you are ready.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 lg:text-lg">
              When calibration starts, keep looking at each dot until it moves. The screen will stay
              quiet and only show the next target.
            </p>

            <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-2 xl:grid-cols-4">
              <ReadinessStatus
                label="Browser"
                value={isFullscreen ? "Full screen" : "Needs full screen"}
                tone={isFullscreen ? "good" : "warn"}
              />
              <ReadinessStatus
                label="Tab"
                value={isVisible ? "Visible" : "Bring this tab forward"}
                tone={isVisible ? "good" : "warn"}
              />
              <ReadinessStatus
                label="Connection"
                value={connectionStatus}
                tone={connectionStatus === "open" ? "good" : "warn"}
              />
              <ReadinessStatus
                label="Signal"
                value={hasRecentLiveGaze ? `${sampleRateHz} Hz detected` : "Waiting for gaze"}
                tone={hasRecentLiveGaze ? "good" : "warn"}
              />
            </div>
          </div>

          <footer className="mx-auto w-full max-w-5xl">
            {!canStart ? (
              <div className="rounded-[2rem] border border-amber-400/20 bg-amber-500/10 p-5 text-amber-100">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Not ready yet</p>
                      <p className="mt-1 text-sm text-amber-100/80">{readinessMessage}</p>
                    </div>
                  </div>
                  {!isFullscreen ? (
                    <Button
                      variant="outline"
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      onClick={onRequestFullscreen}
                    >
                      <Expand className="h-4 w-4" />
                      Enter full screen
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-slate-300">
                  Full screen is active, the tab is visible, and live gaze is coming through.
                </p>
                <Button size="lg" className="min-w-64 rounded-full px-8 text-base" onClick={onStartCalibration}>
                  <CircleDot className="h-5 w-5" />
                  Start five-point calibration
                </Button>
              </div>
            )}
          </footer>
        </div>
      )}

      {!isVisible ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 text-center shadow-2xl">
            <Eye className="mx-auto h-8 w-8 text-cyan-200" />
            <h2 className="mt-4 text-2xl font-semibold">Return to the calibration tab</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              Calibration is paused until this tab is visible again. Keep the browser in front and
              do not minimize it.
            </p>
          </div>
        </div>
      ) : null}

      {!isFullscreen && !isRunning ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-slate-950/80 px-6 py-3 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <Expand className="h-4 w-4 text-cyan-200" />
            <span>The calibration workspace must use the full monitor before it can start.</span>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-5 right-6 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 backdrop-blur">
        <Signal className="h-3.5 w-3.5 text-cyan-200" />
        {sampleRateHz} Hz
      </div>
    </div>
  )
}
