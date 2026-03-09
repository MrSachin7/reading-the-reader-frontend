"use client"

import { CheckCircle2, ScanEye } from "lucide-react"

import { setStepThreeUseLocalCalibration, useAppDispatch, useAppSelector } from "@/redux"
import { Switch } from "@/components/ui/switch"

function formatSignedPercent(value: number | null) {
  if (value === null) {
    return "-"
  }

  const percent = (value * 100).toFixed(1)
  return `${value >= 0 ? "+" : ""}${percent}%`
}

type LocalCalibrationControlProps = {
  className?: string
  compact?: boolean
}

export function LocalCalibrationControl({
  className,
  compact = false,
}: LocalCalibrationControlProps) {
  const dispatch = useAppDispatch()
  const stepThree = useAppSelector((state) => state.experiment.stepThree)
  const hasCalibration =
    stepThree.internalCalibrationStatus === "completed" &&
    stepThree.lastOffsetX !== null &&
    stepThree.lastOffsetY !== null

  const rootClassName = compact
    ? "rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur"
    : "mb-6 rounded-[1.5rem] border p-5"

  const toneClassName = stepThree.useLocalCalibration
    ? "border-emerald-300/50 bg-emerald-500/5"
    : "border-slate-200 bg-card"

  return (
    <section className={`${rootClassName} ${toneClassName} ${className ?? ""}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border border-current/15 bg-background">
            {stepThree.useLocalCalibration ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            ) : (
              <ScanEye className="h-5 w-5 text-slate-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">Use local calibration</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {hasCalibration
                ? "Apply the saved frontend X/Y offset to live gaze values."
                : "No local calibration has been accepted yet."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {stepThree.useLocalCalibration ? "On" : "Off"}
          </span>
          <Switch
            checked={stepThree.useLocalCalibration}
            disabled={!hasCalibration}
            onCheckedChange={(checked) => {
              dispatch(setStepThreeUseLocalCalibration(checked))
            }}
          />
        </div>
      </div>

      {hasCalibration ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Horizontal</p>
            <p className="mt-2 text-lg font-semibold">{formatSignedPercent(stepThree.lastOffsetX)}</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vertical</p>
            <p className="mt-2 text-lg font-semibold">{formatSignedPercent(stepThree.lastOffsetY)}</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Accepted</p>
            <p className="mt-2 text-lg font-semibold">
              {stepThree.lastAppliedAtUnixMs
                ? new Date(stepThree.lastAppliedAtUnixMs).toLocaleTimeString()
                : "-"}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
