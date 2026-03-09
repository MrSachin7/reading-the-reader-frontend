"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Expand, LoaderCircle, ScanEye } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  setStepThreeInternalCalibrationStatus,
  setStepThreeLastAppliedAtUnixMs,
  setStepThreeLastAverageOffset,
  setStepThreeLastOffsetX,
  setStepThreeLastOffsetY,
  setStepThreeLastQuality,
  setStepThreeUseLocalCalibration,
  useAppDispatch,
} from "@/redux"
import { LiveGazeOverlay } from "@/modules/pages/gaze/components/LiveGazeOverlay"
import { useLiveGazeStream } from "@/modules/pages/gaze/lib/use-live-gaze-stream"
import { CalibrationReview } from "./calibration-review"
import { CalibrationTarget } from "./calibration-target"
import {
  CALIBRATION_POINTS,
  TARGET_BURST_MS,
  STABLE_SPREAD_THRESHOLD,
  STABLE_HOLD_DURATION_MS,
  TARGET_CAPTURE_TIMEOUT_MS,
  TARGET_MOVE_MS,
  TARGET_SETTLE_MS,
  type CalibrationTargetPhase,
  type CalibrationSummary,
  type TimedPoint,
  summarizeCalibration,
  summarizeCalibrationPoint,
  wait,
  findStableWindow,
} from "./calibration-utils"

type CalibrationPhase = "ready" | "running" | "review"

export default function CalibrationPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [phase, setPhase] = React.useState<CalibrationPhase>("ready")
  const [activePointIndex, setActivePointIndex] = React.useState(0)
  const [targetPhase, setTargetPhase] = React.useState<CalibrationTargetPhase>("move")
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(true)
  const [statusMessage, setStatusMessage] = React.useState(
    "Enter full screen and look at the center target."
  )
  const [summary, setSummary] = React.useState<CalibrationSummary | null>(null)
  const { rawPoint, smoothedPoint, connectionStats, sampleRateHz, hasRecentGaze } =
    useLiveGazeStream({ applyLocalCalibration: false })

  const capturePointsRef = React.useRef<TimedPoint[]>([])
  const runTokenRef = React.useRef(0)
  const phaseRef = React.useRef<CalibrationPhase>("ready")

  const activeTarget = CALIBRATION_POINTS[activePointIndex] ?? CALIBRATION_POINTS[0]
  const canStart = isFullscreen && isVisible && connectionStats?.status === "open" && hasRecentGaze

  React.useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  React.useEffect(() => {
    setIsFullscreen(Boolean(document.fullscreenElement))
    setIsVisible(document.visibilityState === "visible")

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible")
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  React.useEffect(() => {
    if (!rawPoint || phaseRef.current !== "running") {
      return
    }

    capturePointsRef.current.push({
      ...rawPoint,
      capturedAtUnixMs: Date.now(),
    })
  }, [rawPoint])

  React.useEffect(() => {
    if (phase !== "running") {
      return
    }

    if (!isVisible || !isFullscreen) {
      runTokenRef.current += 1
      setPhase("ready")
      setActivePointIndex(0)
      setTargetPhase("move")
      setStatusMessage("Calibration paused. Return to this page and keep the browser full screen.")
    }
  }, [isFullscreen, isVisible, phase])

  const requestFullscreen = React.useCallback(async () => {
    if (document.fullscreenElement) {
      return
    }

    try {
      await document.documentElement.requestFullscreen()
    } catch {
      setStatusMessage("The browser blocked full screen. Use the full-screen button again.")
    }
  }, [])

  const collectPoint = React.useCallback(async (pointIndex: number, runToken: number) => {
    const point = CALIBRATION_POINTS[pointIndex]

    setActivePointIndex(pointIndex)
    setTargetPhase("move")
    setStatusMessage(`Move your eyes to ${point.label.toLowerCase()}.`)
    await wait(TARGET_MOVE_MS)

    if (runTokenRef.current !== runToken) {
      return null
    }

    setTargetPhase("settle")
    setStatusMessage(`Hold your gaze on ${point.label.toLowerCase()}.`)
    await wait(TARGET_SETTLE_MS)

    if (runTokenRef.current !== runToken) {
      return null
    }

    capturePointsRef.current = []
    setTargetPhase("hold")
    setStatusMessage(`Look at the center and hold until the dot bursts.`)

    const startedAt = Date.now()
    let stableSinceUnixMs: number | null = null

    while (Date.now() - startedAt < TARGET_CAPTURE_TIMEOUT_MS) {
      if (runTokenRef.current !== runToken) {
        return null
      }

      const stableWindow = findStableWindow(capturePointsRef.current)
      if (stableWindow && stableWindow.spread <= STABLE_SPREAD_THRESHOLD) {
        if (stableSinceUnixMs === null) {
          stableSinceUnixMs = Date.now()
        }

        if (Date.now() - stableSinceUnixMs >= STABLE_HOLD_DURATION_MS) {
          setTargetPhase("burst")
          setStatusMessage(`Good. Keep still while we lock ${point.label.toLowerCase()}.`)
          await wait(TARGET_BURST_MS)
          break
        }
      } else {
        stableSinceUnixMs = null
      }

      await wait(80)
    }

    const capturedPoints = [...capturePointsRef.current]
    capturePointsRef.current = []
    setTargetPhase("move")

    return summarizeCalibrationPoint(point, capturedPoints)
  }, [])

  const startCalibration = React.useCallback(async () => {
    if (!canStart) {
      return
    }

    const runToken = runTokenRef.current + 1
    runTokenRef.current = runToken
    setPhase("running")
    setSummary(null)
    setTargetPhase("move")
    setStatusMessage("Starting calibration.")

    const nextResults = []

    for (let pointIndex = 0; pointIndex < CALIBRATION_POINTS.length; pointIndex += 1) {
      const result = await collectPoint(pointIndex, runToken)

      if (!result) {
        return
      }

      nextResults.push(result)
    }

    if (runTokenRef.current !== runToken) {
      return
    }

    setSummary(summarizeCalibration(nextResults))
    setPhase("review")
    setStatusMessage("Review the estimated local offset.")
  }, [canStart, collectPoint])

  const handleRetry = () => {
    runTokenRef.current += 1
    capturePointsRef.current = []
    setSummary(null)
    setPhase("ready")
    setActivePointIndex(0)
    setTargetPhase("move")
    setStatusMessage("Enter full screen and look at the center target.")
  }

  const handleAccept = () => {
    if (!summary) {
      return
    }

    dispatch(setStepThreeInternalCalibrationStatus("completed"))
    dispatch(setStepThreeLastAppliedAtUnixMs(Date.now()))
    dispatch(setStepThreeLastAverageOffset(summary.averageOffset))
    dispatch(setStepThreeLastOffsetX(summary.offsetX))
    dispatch(setStepThreeLastOffsetY(summary.offsetY))
    dispatch(setStepThreeLastQuality(summary.quality))
    dispatch(setStepThreeUseLocalCalibration(true))
    router.push("/experiment")
  }

  if (phase === "review" && summary) {
    return <CalibrationReview summary={summary} onRetry={handleRetry} onAccept={handleAccept} />
  }

  return (
    <main className="relative min-h-screen w-screen overflow-hidden bg-slate-50 text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,1))]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b bg-white/92 px-6 py-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Calibration</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Estimate the local gaze offset</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/experiment">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {!isFullscreen ? (
              <Button onClick={() => void requestFullscreen()}>
                <Expand className="h-4 w-4" />
                Enter full screen
              </Button>
            ) : null}
          </div>
        </header>

        <div className="grid flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b bg-white px-6 py-6 lg:border-b-0 lg:border-r lg:px-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold">What to do</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Keep your head still and follow the target with your eyes only. Look at the very
                  center of the dot and hold until it bursts.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Connection</p>
                  <p className="mt-2 text-sm font-medium">{connectionStats?.status ?? "connecting"}</p>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live gaze</p>
                  <p className="mt-2 text-sm font-medium">
                    {hasRecentGaze ? `${sampleRateHz} Hz` : "Waiting for signal"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Progress</p>
                  <p className="mt-2 text-sm font-medium">
                    {phase === "running"
                      ? `${activePointIndex + 1} / ${CALIBRATION_POINTS.length}`
                      : "Ready"}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border bg-slate-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{statusMessage}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button disabled={!canStart || phase === "running"} onClick={() => void startCalibration()}>
                  {phase === "running" ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Running
                    </>
                  ) : (
                    <>
                      <ScanEye className="h-4 w-4" />
                      Start calibration
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleRetry}>
                  Reset
                </Button>
              </div>

              {!canStart ? (
                <p className="text-sm leading-7 text-slate-500">
                  {!isFullscreen
                    ? "Enter full screen before starting."
                    : !isVisible
                      ? "Bring this page back to the front."
                      : connectionStats?.status !== "open"
                        ? "Waiting for websocket connection."
                        : "Look at the screen until gaze data stabilizes."}
                </p>
              ) : null}
            </div>
          </aside>

          <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
            <div className="absolute inset-0" />
            <CalibrationTarget
              x={activeTarget.x}
              y={activeTarget.y}
              phase={targetPhase}
            />

            <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
              {CALIBRATION_POINTS.map((point, index) => (
                <span
                  key={point.id}
                  className={`h-2.5 rounded-full transition-all ${
                    index < activePointIndex
                      ? "w-10 bg-sky-500"
                      : index === activePointIndex
                        ? "w-14 bg-slate-950"
                        : "w-10 bg-slate-300"
                  }`}
                />
              ))}
            </div>

            {phase === "ready" ? (
              <div className="pointer-events-none text-center">
                <p className="text-sm uppercase tracking-[0.26em] text-slate-500">Ready</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight">Look at the target.</h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
                  The calibration collects a stable gaze window at five points and uses the
                  difference to estimate the X/Y offset.
                </p>
              </div>
            ) : null}

            {phase === "running" ? (
              <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 rounded-full border bg-white/90 px-5 py-2 text-sm text-slate-700 shadow-sm">
                {targetPhase === "hold"
                  ? `Hold on ${activeTarget.label.toLowerCase()} until it bursts`
                  : targetPhase === "burst"
                    ? `Locked ${activeTarget.label.toLowerCase()}`
                    : `Move to ${activeTarget.label.toLowerCase()}`}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <LiveGazeOverlay
        statusVariant="none"
        hideMarkerWhenNoPoint
        point={smoothedPoint}
        connectionStats={connectionStats}
        sampleRateHz={sampleRateHz}
        hasRecentGaze={hasRecentGaze}
        markerClassName="z-20 border-sky-500 bg-sky-400/35 shadow-[0_0_18px_rgba(14,165,233,0.45)]"
      />

    </main>
  )
}
