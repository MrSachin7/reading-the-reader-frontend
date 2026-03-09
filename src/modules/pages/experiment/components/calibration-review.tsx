"use client"

import { CheckCircle2, RefreshCw, RotateCcw, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalibrationPlot } from "./calibration-plot"
import {
  type CalibrationRunSummary,
  formatNormalizedMetric,
  formatSignedNormalizedMetric,
} from "./utils"

type CalibrationReviewProps = {
  summary: CalibrationRunSummary
  onRetry: () => void
  onAccept: () => void
  onClose: () => void
}

export function CalibrationReview({
  summary,
  onRetry,
  onAccept,
  onClose,
}: CalibrationReviewProps) {
  const qualityToneClassName =
    summary.quality === "good"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : summary.quality === "fair"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
        : summary.quality === "poor"
          ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
          : "border-white/10 bg-white/5 text-slate-200"

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.18),rgba(2,6,23,0.98)_52%)] text-white">
      <header className="flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3">
          <Badge className="bg-white/10 text-white">Calibration review</Badge>
          <Badge variant="outline" className={`text-white ${qualityToneClassName}`}>
            {summary.quality}
          </Badge>
        </div>
        <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
          Exit
        </Button>
      </header>

      <div className="grid gap-8 px-6 pb-8 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
        <section className="flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Local result</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-6xl">
            Estimated correction for this session.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 lg:text-lg">
            This is computed locally from the gaze samples captured during the five-point pass. It
            is not sent to the backend yet, but it can already be used as the session correction to
            carry forward.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Horizontal offset</p>
              <p className="mt-3 text-3xl font-semibold">{formatSignedNormalizedMetric(summary.offsetX)}</p>
              <p className="mt-2 text-sm text-slate-300">
                Positive means gaze should shift right. Negative means left.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Vertical offset</p>
              <p className="mt-3 text-3xl font-semibold">{formatSignedNormalizedMetric(summary.offsetY)}</p>
              <p className="mt-2 text-sm text-slate-300">
                Positive means gaze should shift down. Negative means up.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Average offset</p>
              <p className="mt-3 text-3xl font-semibold">{formatNormalizedMetric(summary.averageOffset)}</p>
              <p className="mt-2 text-sm text-slate-300">
                Lower is better. This is the average distance from target to captured gaze.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Average spread</p>
              <p className="mt-3 text-3xl font-semibold">{formatNormalizedMetric(summary.averageSpread)}</p>
              <p className="mt-2 text-sm text-slate-300">
                Lower spread indicates more stable fixation around each point.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Calibration plot</p>
                <p className="mt-1 text-xs text-slate-400">
                  White circles are targets. Cyan points show the captured centroids.
                </p>
              </div>
              <Badge variant="outline" className="border-white/10 text-slate-300">
                {summary.validPointCount} / {summary.points.length} points usable
              </Badge>
            </div>
            <div className="aspect-square">
              <CalibrationPlot points={summary.points} />
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-slate-950/55 px-6 py-5 backdrop-blur lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-300">
            Accept to store this local correction in the frontend session. Retry if the participant
            moved, lost focus, or the result looks off.
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <RotateCcw className="h-4 w-4" />
              Exit without saving
            </Button>
            <Button onClick={onAccept}>
              <CheckCircle2 className="h-4 w-4" />
              Use local calibration
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
