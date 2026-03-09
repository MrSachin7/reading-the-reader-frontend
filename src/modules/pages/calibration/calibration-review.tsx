"use client"

import Link from "next/link"
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CalibrationSummary } from "./calibration-utils"
import {
  formatPercent,
  formatQualityLabel,
  formatSignedPercent,
} from "./calibration-utils"

type CalibrationReviewProps = {
  summary: CalibrationSummary
  onRetry: () => void
  onAccept: () => void
}

export function CalibrationReview({
  summary,
  onRetry,
  onAccept,
}: CalibrationReviewProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Calibration result</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Review the local offset.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              The offset below is calculated from the stable gaze windows captured at each target.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/experiment">
              <ArrowLeft className="h-4 w-4" />
              Back to experiment
            </Link>
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Horizontal offset</p>
            <p className="mt-3 text-3xl font-semibold">{formatSignedPercent(summary.offsetX)}</p>
          </div>
          <div className="rounded-[1.5rem] border bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Vertical offset</p>
            <p className="mt-3 text-3xl font-semibold">{formatSignedPercent(summary.offsetY)}</p>
          </div>
          <div className="rounded-[1.5rem] border bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Average offset</p>
            <p className="mt-3 text-3xl font-semibold">{formatPercent(summary.averageOffset)}</p>
          </div>
          <div className="rounded-[1.5rem] border bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quality</p>
            <p className="mt-3 text-3xl font-semibold">{formatQualityLabel(summary.quality)}</p>
          </div>
        </section>

        <section className="rounded-[1.75rem] border bg-white">
          <div className="border-b px-5 py-4">
            <p className="text-sm font-semibold">Per-point capture</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Point</th>
                  <th className="px-5 py-3 font-medium">Target</th>
                  <th className="px-5 py-3 font-medium">Centroid</th>
                  <th className="px-5 py-3 font-medium">Offset X</th>
                  <th className="px-5 py-3 font-medium">Offset Y</th>
                  <th className="px-5 py-3 font-medium">Spread</th>
                </tr>
              </thead>
              <tbody>
                {summary.points.map((point) => (
                  <tr key={point.id} className="border-t">
                    <td className="px-5 py-4 font-medium">{point.label}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatPercent(point.target.x)} / {formatPercent(point.target.y)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {point.centroid
                        ? `${formatPercent(point.centroid.x)} / ${formatPercent(point.centroid.y)}`
                        : "-"}
                    </td>
                    <td className="px-5 py-4">{formatSignedPercent(point.offsetX)}</td>
                    <td className="px-5 py-4">{formatSignedPercent(point.offsetY)}</td>
                    <td className="px-5 py-4">{formatPercent(point.spread)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer className="border-t bg-white/95 px-6 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {summary.validPointCount} of {summary.points.length} points produced a usable stable window.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
            <Button onClick={onAccept}>
              <CheckCircle2 className="h-4 w-4" />
              Use this offset
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
