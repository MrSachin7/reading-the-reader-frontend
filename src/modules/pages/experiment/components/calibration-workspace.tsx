"use client"

import * as React from "react"

import { type ConnectionStats, type GazeData, subscribeToConnectionStats, subscribeToGaze } from "@/lib/gaze-socket"
import type { CalibrationPointPayload } from "@/redux"
import { CalibrationExternalGuide } from "./calibration-external-guide"
import { CalibrationReview } from "./calibration-review"
import { CalibrationStage } from "./calibration-stage"
import {
  CALIBRATION_POINTS,
  TARGET_CAPTURE_MS,
  TARGET_MOVE_MS,
  TARGET_SETTLE_MS,
  type CalibrationRunSummary,
  type CalibrationTargetPhase,
  type CalibrationWorkspacePhase,
  type NormalizedPoint,
  calculatePoint,
  summarizeCalibrationPoint,
  summarizeCalibrationRun,
  wait,
} from "./utils"

type CalibrationWorkspaceProps = {
  isOpen: boolean
  externalCalibrationCompleted: boolean
  onExternalCalibrationCompletedChange: (completed: boolean) => void
  onClose: () => void
  onAccept: (summary: CalibrationRunSummary) => void
}

export function CalibrationWorkspace({
  isOpen,
  externalCalibrationCompleted,
  onExternalCalibrationCompletedChange,
  onClose,
  onAccept,
}: CalibrationWorkspaceProps) {
  const [phase, setPhase] = React.useState<CalibrationWorkspacePhase>("external")
  const [connectionStats, setConnectionStats] = React.useState<ConnectionStats | null>(null)
  const [sampleRateHz, setSampleRateHz] = React.useState(0)
  const [hasRecentLiveGaze, setHasRecentLiveGaze] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activePointIndex, setActivePointIndex] = React.useState(-1)
  const [targetPhase, setTargetPhase] = React.useState<CalibrationTargetPhase>("idle")
  const [capturedPoints, setCapturedPoints] = React.useState<CalibrationPointPayload[]>([])
  const [summary, setSummary] = React.useState<CalibrationRunSummary | null>(null)

  const workspaceRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const gazeMarkerRef = React.useRef<HTMLDivElement>(null)
  const livePointRef = React.useRef<NormalizedPoint | null>(null)
  const lastValidPointSeenAtRef = React.useRef<number>(0)
  const sampleCounterRef = React.useRef(0)
  const captureBufferRef = React.useRef<GazeData[] | null>(null)
  const runTokenRef = React.useRef(0)

  React.useEffect(() => {
    if (!isOpen) {
      return
    }

    setPhase(externalCalibrationCompleted ? "readiness" : "external")
    setIsVisible(document.visibilityState === "visible")
    setIsFullscreen(Boolean(document.fullscreenElement))

    const unsubscribeGaze = subscribeToGaze((sample) => {
      livePointRef.current = calculatePoint(sample)
      sampleCounterRef.current += 1

      if (livePointRef.current) {
        lastValidPointSeenAtRef.current = Date.now()
      }

      if (captureBufferRef.current) {
        captureBufferRef.current.push(sample)
      }
    })

    const unsubscribeStats = subscribeToConnectionStats((stats) => {
      setConnectionStats(stats)
    })

    const sampleRateTimer = window.setInterval(() => {
      setSampleRateHz(sampleCounterRef.current)
      sampleCounterRef.current = 0
    }, 1_000)

    const livenessTimer = window.setInterval(() => {
      setHasRecentLiveGaze(Date.now() - lastValidPointSeenAtRef.current < 600)
    }, 250)

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible")
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    let frameId = 0

    const render = () => {
      const marker = gazeMarkerRef.current
      const point = livePointRef.current

      if (marker) {
        if (point) {
          marker.style.left = `${point.x * 100}%`
          marker.style.top = `${point.y * 100}%`
          marker.style.opacity = "1"
        } else {
          marker.style.opacity = "0"
        }
      }

      frameId = window.requestAnimationFrame(render)
    }

    frameId = window.requestAnimationFrame(render)
    document.body.style.overflow = "hidden"

    return () => {
      runTokenRef.current += 1
      captureBufferRef.current = null
      unsubscribeGaze()
      unsubscribeStats()
      window.clearInterval(sampleRateTimer)
      window.clearInterval(livenessTimer)
      window.cancelAnimationFrame(frameId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.body.style.overflow = ""
    }
  }, [externalCalibrationCompleted, isOpen])

  React.useEffect(() => {
    if (phase !== "running") {
      return
    }

    if (!isVisible || !isFullscreen) {
      runTokenRef.current += 1
      captureBufferRef.current = null
      setCapturedPoints([])
      setActivePointIndex(-1)
      setTargetPhase("idle")
      setSummary(null)
      setPhase("readiness")
    }
  }, [isFullscreen, isVisible, phase])

  const requestFullscreen = React.useCallback(async () => {
    if (document.fullscreenElement) {
      return
    }

    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // Browser rejected the request. The readiness UI keeps guiding the user.
    }
  }, [])

  const handleClose = React.useCallback(async () => {
    runTokenRef.current += 1
    setCapturedPoints([])
    setSummary(null)
    setActivePointIndex(-1)
    setTargetPhase("idle")
    setPhase(externalCalibrationCompleted ? "readiness" : "external")

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // Ignore browser refusal.
      }
    }

    onClose()
  }, [externalCalibrationCompleted, onClose])

  const handleConfirmExternalCalibration = async () => {
    onExternalCalibrationCompletedChange(true)
    await requestFullscreen()
    setPhase("readiness")
  }

  const handleStartCalibration = React.useCallback(async () => {
    if (!isFullscreen || !isVisible || connectionStats?.status !== "open" || !hasRecentLiveGaze) {
      return
    }

    setPhase("running")
    setSummary(null)
    setCapturedPoints([])
    setTargetPhase("idle")

    const runToken = runTokenRef.current + 1
    runTokenRef.current = runToken
    const nextPoints: CalibrationPointPayload[] = []

    for (const [index, definition] of CALIBRATION_POINTS.entries()) {
      if (runTokenRef.current !== runToken) {
        return
      }

      setActivePointIndex(index)
      setTargetPhase(index === 0 ? "settle" : "move")

      if (index > 0) {
        await wait(TARGET_MOVE_MS)
      }

      if (runTokenRef.current !== runToken) {
        return
      }

      setTargetPhase("settle")
      await wait(TARGET_SETTLE_MS)

      if (runTokenRef.current !== runToken) {
        return
      }

      setTargetPhase("capture")
      captureBufferRef.current = []
      const startedAtUnixMs = Date.now()
      await wait(TARGET_CAPTURE_MS)
      const completedAtUnixMs = Date.now()
      const samples = captureBufferRef.current ?? []
      captureBufferRef.current = null

      nextPoints.push({
        ...summarizeCalibrationPoint(definition, samples),
        startedAtUnixMs,
        completedAtUnixMs,
      })
    }

    const nextSummary = summarizeCalibrationRun(nextPoints)
    setCapturedPoints(nextPoints)
    setSummary(nextSummary)
    setTargetPhase("idle")
    setActivePointIndex(-1)
    setPhase("review")
  }, [connectionStats?.status, hasRecentLiveGaze, isFullscreen, isVisible])

  if (!isOpen) {
    return null
  }

  return (
    <div ref={workspaceRef} className="fixed inset-0 z-[120]">
      {phase === "external" ? (
        <CalibrationExternalGuide
          isFullscreen={isFullscreen}
          isVisible={isVisible}
          externalCalibrationCompleted={externalCalibrationCompleted}
          onRequestFullscreen={() => void requestFullscreen()}
          onConfirmExternalCalibration={() => void handleConfirmExternalCalibration()}
          onClose={() => void handleClose()}
        />
      ) : phase === "review" && summary ? (
        <CalibrationReview
          summary={summary}
          onRetry={() => {
            setSummary(null)
            setCapturedPoints([])
            setPhase("readiness")
          }}
          onAccept={() => {
            onAccept(summary)
            void handleClose()
          }}
          onClose={() => void handleClose()}
        />
      ) : (
        <CalibrationStage
          phase={phase}
          isFullscreen={isFullscreen}
          isVisible={isVisible}
          connectionStatus={connectionStats?.status ?? "connecting"}
          hasRecentLiveGaze={hasRecentLiveGaze}
          sampleRateHz={sampleRateHz}
          activeTarget={phase === "running" ? CALIBRATION_POINTS[activePointIndex] ?? null : CALIBRATION_POINTS[0]}
          activePointIndex={Math.max(activePointIndex, 0)}
          totalPoints={CALIBRATION_POINTS.length}
          targetPhase={targetPhase}
          stageRef={stageRef}
          gazeMarkerRef={gazeMarkerRef}
          onRequestFullscreen={() => void requestFullscreen()}
          onStartCalibration={() => void handleStartCalibration()}
          onClose={() => void handleClose()}
        />
      )}
    </div>
  )
}
