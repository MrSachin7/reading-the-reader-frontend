"use client"

import * as React from "react"
import {
  ArrowUpRight,
  CheckCircle2,
  Expand,
  Monitor,
  ScanEye,
  SkipForward,
  WandSparkles,
} from "lucide-react"

import {
  setStepThreeExternalCalibrationCompleted,
  setStepThreeInternalCalibrationStatus,
  setStepThreeLastAppliedAtUnixMs,
  setStepThreeLastAverageOffset,
  setStepThreeLastOffsetX,
  setStepThreeLastOffsetY,
  setStepThreeLastQuality,
  useAppDispatch,
  useAppSelector,
} from "@/redux"
import type { RootState } from "@/redux"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalibrationWorkspace } from "./calibration-workspace"
import {
  type CalibrationRunSummary,
  type CalibrationStepProps,
  formatNormalizedMetric,
  formatSignedNormalizedMetric,
} from "./utils"

export function CalibrationStep({
  onCompletionChange,
  onSubmitRequestChange,
  onSubmittingChange,
}: CalibrationStepProps) {
  const dispatch = useAppDispatch()
  const stepThree = useAppSelector((state: RootState) => state.experiment.stepThree)
  const [workspaceOpen, setWorkspaceOpen] = React.useState(false)

  const isComplete =
    stepThree.externalCalibrationCompleted &&
    (stepThree.internalCalibrationStatus === "skipped" ||
      stepThree.internalCalibrationStatus === "completed")

  React.useEffect(() => {
    onCompletionChange?.(isComplete)
  }, [isComplete, onCompletionChange])

  React.useEffect(() => {
    onSubmitRequestChange?.(null)
    return () => onSubmitRequestChange?.(null)
  }, [onSubmitRequestChange])

  React.useEffect(() => {
    onSubmittingChange?.(workspaceOpen)
    return () => onSubmittingChange?.(false)
  }, [onSubmittingChange, workspaceOpen])

  const openWorkspace = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        // The workspace itself keeps guiding the user if the request fails.
      }
    }

    setWorkspaceOpen(true)
  }

  const handleAcceptCalibration = (summary: CalibrationRunSummary) => {
    dispatch(setStepThreeInternalCalibrationStatus("completed"))
    dispatch(setStepThreeExternalCalibrationCompleted(true))
    dispatch(setStepThreeLastAppliedAtUnixMs(Date.now()))
    dispatch(setStepThreeLastQuality(summary.quality))
    dispatch(setStepThreeLastAverageOffset(summary.averageOffset))
    dispatch(setStepThreeLastOffsetX(summary.offsetX))
    dispatch(setStepThreeLastOffsetY(summary.offsetY))
  }

  const handleSkipInternalCalibration = () => {
    if (!stepThree.externalCalibrationCompleted) {
      return
    }

    dispatch(setStepThreeInternalCalibrationStatus("skipped"))
  }

  return (
    <>
      <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <CardHeader className="border-b bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),rgba(255,255,255,0)_42%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,1))] pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Full-screen step</Badge>
            <Badge variant="outline">Whole monitor</Badge>
            <Badge variant="outline">Local offset estimate</Badge>
          </div>
          <CardTitle className="mt-3 text-3xl tracking-tight">Calibration uses the entire display.</CardTitle>
          <CardDescription className="max-w-3xl text-base leading-7">
            Launch the workspace to guide the participant in full screen. The browser checks that
            the tab is visible, uses live gaze from the websocket, and computes a local session
            correction from the five captured points.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pt-8">
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border bg-muted/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Step 1</p>
              <p className="mt-3 text-lg font-semibold">Complete Tobii calibration</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The workspace first asks the operator to finish the vendor software calibration.
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Step 2</p>
              <p className="mt-3 text-lg font-semibold">Guide the participant full screen</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The browser takes over the whole monitor, keeps instructions focused, and blocks the
                run if the tab is hidden or full screen is lost.
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Step 3</p>
              <p className="mt-3 text-lg font-semibold">Estimate the session correction</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The frontend computes horizontal and vertical offsets locally and stores them for the
                current session until backend calibration apply is implemented.
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.75rem] border bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 p-3">
                  <Expand className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Launch calibration workspace</p>
                  <p className="text-sm text-slate-300">
                    Opens a fixed full-screen flow with one instruction at a time.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Monitor className="h-5 w-5 text-cyan-200" />
                  <p className="mt-3 text-sm font-medium">Full monitor</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    The run only starts when the browser is in full screen.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <ScanEye className="h-5 w-5 text-cyan-200" />
                  <p className="mt-3 text-sm font-medium">Live websocket gaze</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    The stage subscribes to gaze only while the workspace is active.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <WandSparkles className="h-5 w-5 text-cyan-200" />
                  <p className="mt-3 text-sm font-medium">Local correction</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    The result is accepted locally for now, without backend submission.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full px-8" onClick={() => void openWorkspace()}>
                  <ArrowUpRight className="h-4 w-4" />
                  Open full-screen workspace
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  disabled={!stepThree.externalCalibrationCompleted}
                  onClick={handleSkipInternalCalibration}
                >
                  <SkipForward className="h-4 w-4" />
                  Skip in-app pass
                </Button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Current state</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                  <span className="text-sm font-medium">External Tobii calibration</span>
                  <Badge variant={stepThree.externalCalibrationCompleted ? "secondary" : "outline"}>
                    {stepThree.externalCalibrationCompleted ? "Confirmed" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                  <span className="text-sm font-medium">In-app pass</span>
                  <Badge variant={stepThree.internalCalibrationStatus === "completed" ? "secondary" : "outline"}>
                    {stepThree.internalCalibrationStatus}
                  </Badge>
                </div>
              </div>

              {stepThree.internalCalibrationStatus === "completed" ? (
                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Horizontal correction</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatSignedNormalizedMetric(stepThree.lastOffsetX)}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Vertical correction</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatSignedNormalizedMetric(stepThree.lastOffsetY)}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Average offset</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatNormalizedMetric(stepThree.lastAverageOffset)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-muted-foreground">
                  No accepted in-app calibration yet. Launch the workspace when the participant is
                  ready.
                </p>
              )}
            </div>
          </section>

          {stepThree.internalCalibrationStatus === "skipped" ? (
            <Alert className="border-amber-400/40 bg-amber-500/5">
              <SkipForward />
              <AlertTitle>In-app calibration skipped</AlertTitle>
              <AlertDescription>
                The external Tobii calibration is still considered sufficient to complete this step.
              </AlertDescription>
            </Alert>
          ) : null}

          {stepThree.internalCalibrationStatus === "completed" ? (
            <Alert className="border-emerald-400/40 bg-emerald-500/5">
              <CheckCircle2 />
              <AlertTitle>Local calibration accepted</AlertTitle>
              <AlertDescription>
                The frontend stored the estimated session correction locally. Backend apply can be
                wired to the same result later.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <CalibrationWorkspace
        isOpen={workspaceOpen}
        externalCalibrationCompleted={stepThree.externalCalibrationCompleted}
        onExternalCalibrationCompletedChange={(completed) =>
          dispatch(setStepThreeExternalCalibrationCompleted(completed))
        }
        onClose={() => setWorkspaceOpen(false)}
        onAccept={handleAcceptCalibration}
      />
    </>
  )
}
