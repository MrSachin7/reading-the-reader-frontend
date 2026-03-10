"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, ScanEye } from "lucide-react"

import {
  setStepThreeExternalCalibrationCompleted,
  setStepThreeInternalCalibrationStatus,
  setStepThreeUseLocalCalibration,
  useAppDispatch,
  useAppSelector,
} from "@/redux"
import type { RootState } from "@/redux"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type CalibrationStepProps } from "./utils"

export function CalibrationStep({
  onCompletionChange,
  onSubmitRequestChange,
  onSubmittingChange,
}: CalibrationStepProps) {
  const dispatch = useAppDispatch()
  const stepThree = useAppSelector((state: RootState) => state.experiment.stepThree)

  const isComplete = stepThree.externalCalibrationCompleted
  const isRunning = stepThree.internalCalibrationStatus === "running"
  const hasFailed = stepThree.internalCalibrationStatus === "failed"

  React.useEffect(() => {
    onCompletionChange?.(isComplete)
  }, [isComplete, onCompletionChange])

  React.useEffect(() => {
    onSubmitRequestChange?.(null)
    return () => onSubmitRequestChange?.(null)
  }, [onSubmitRequestChange])

  React.useEffect(() => {
    onSubmittingChange?.(false)
    return () => onSubmittingChange?.(false)
  }, [onSubmittingChange])

  const handleReset = () => {
    dispatch(setStepThreeExternalCalibrationCompleted(false))
    dispatch(setStepThreeInternalCalibrationStatus("pending"))
    dispatch(setStepThreeUseLocalCalibration(false))
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Step 3</Badge>
          <Badge variant="outline">Calibration</Badge>
        </div>
        <CardTitle className="mt-3 text-3xl tracking-tight">
          Run the Tobii hardware calibration.
        </CardTitle>
        <CardDescription className="max-w-3xl text-base leading-7">
          This flow drives Tobii&apos;s screen-based calibration from the backend. Open the full
          calibration page, guide the participant through the five targets, and return here once it
          has been applied on the eye tracker.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-8">
        <div className="rounded-[1.75rem] border bg-muted/20 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-base font-semibold">Launch the calibration screen.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The backend enters Tobii calibration mode, collects all five points, and applies the
                result directly on the selected eye tracker.
              </p>
            </div>
            <Button asChild>
              <Link href="/calibration">
                <ScanEye className="h-4 w-4" />
                {isComplete ? "Run again" : "Open calibration"}
              </Link>
            </Button>
          </div>
        </div>

        {stepThree.externalCalibrationCompleted ? (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-400/30 bg-emerald-500/5 p-4 text-emerald-900 dark:text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Calibration applied</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                The selected eye tracker has an active Tobii calibration from this setup flow.
              </p>
            </div>
          </div>
        ) : null}

        {isRunning ? (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-sky-400/30 bg-sky-500/5 p-4 text-sky-950">
            <ScanEye className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Calibration in progress</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                Keep the participant on the calibration screen until the backend reports success or
                failure.
              </p>
            </div>
          </div>
        ) : null}

        {hasFailed ? (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-400/30 bg-amber-500/5 p-4 text-amber-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Calibration needs to be rerun</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                The last attempt did not apply successfully on the eye tracker.
              </p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Clear state
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
