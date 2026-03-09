import type { GazeData } from "@/lib/gaze-socket"
import type { CalibrationPattern, CalibrationPointPayload } from "@/redux"

export type CalibrationStepProps = {
  onCompletionChange?: (isComplete: boolean) => void
  onSubmitRequestChange?: (submitHandler: (() => Promise<boolean>) | null) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}

export type CalibrationRunState = "idle" | "running" | "review"

export type CalibrationTargetPhase = "idle" | "move" | "settle" | "capture"

export type CalibrationWorkspacePhase = "external" | "readiness" | "running" | "review"

export type NormalizedPoint = {
  x: number
  y: number
}

export type CalibrationPointDefinition = {
  pointId: string
  label: string
  x: number
  y: number
}

export type CaptureQuality = "good" | "fair" | "poor" | "missing"

export type CalibrationRunSummary = {
  points: CalibrationPointPayload[]
  averageOffset: number | null
  averageSpread: number | null
  offsetX: number | null
  offsetY: number | null
  quality: "good" | "fair" | "poor" | "unknown"
  validPointCount: number
}

export const CALIBRATION_PATTERN: CalibrationPattern = "screen-based-five-point"

export const CALIBRATION_POINTS: CalibrationPointDefinition[] = [
  { pointId: "p1", label: "Center", x: 0.5, y: 0.5 },
  { pointId: "p2", label: "Top left", x: 0.14, y: 0.18 },
  { pointId: "p3", label: "Top right", x: 0.86, y: 0.18 },
  { pointId: "p4", label: "Bottom right", x: 0.86, y: 0.82 },
  { pointId: "p5", label: "Bottom left", x: 0.14, y: 0.82 },
]

export const TARGET_MOVE_MS = 700
export const TARGET_SETTLE_MS = 550
export const TARGET_CAPTURE_MS = 900

export function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}

function isValidEye(value: string) {
  return value.toLowerCase() === "valid"
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function calculateDistance(a: NormalizedPoint, b: NormalizedPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function calculatePoint(sample: GazeData): NormalizedPoint | null {
  const leftValid = isValidEye(sample.leftEyeValidity)
  const rightValid = isValidEye(sample.rightEyeValidity)

  if (leftValid && rightValid) {
    return {
      x: clamp01((sample.leftEyeX + sample.rightEyeX) / 2),
      y: clamp01((sample.leftEyeY + sample.rightEyeY) / 2),
    }
  }

  if (leftValid) {
    return { x: clamp01(sample.leftEyeX), y: clamp01(sample.leftEyeY) }
  }

  if (rightValid) {
    return { x: clamp01(sample.rightEyeX), y: clamp01(sample.rightEyeY) }
  }

  return null
}

export function summarizeCalibrationPoint(
  definition: CalibrationPointDefinition,
  samples: GazeData[]
): CalibrationPointPayload {
  const validPoints = samples
    .map((sample) => calculatePoint(sample))
    .filter((point): point is NormalizedPoint => point !== null)

  const centroid =
    validPoints.length > 0
      ? {
          x: validPoints.reduce((sum, point) => sum + point.x, 0) / validPoints.length,
          y: validPoints.reduce((sum, point) => sum + point.y, 0) / validPoints.length,
        }
      : null

  const averageOffset =
    validPoints.length > 0
      ? validPoints.reduce(
          (sum, point) => sum + calculateDistance(point, { x: definition.x, y: definition.y }),
          0
        ) / validPoints.length
      : null

  const averageSpread =
    centroid && validPoints.length > 0
      ? validPoints.reduce((sum, point) => sum + calculateDistance(point, centroid), 0) /
        validPoints.length
      : null

  return {
    pointId: definition.pointId,
    targetX: definition.x,
    targetY: definition.y,
    startedAtUnixMs: 0,
    completedAtUnixMs: 0,
    sampleCount: samples.length,
    validSampleCount: validPoints.length,
    centroidX: centroid?.x ?? null,
    centroidY: centroid?.y ?? null,
    averageOffset,
    averageSpread,
    samples,
  }
}

export function getCaptureQuality(point: CalibrationPointPayload): CaptureQuality {
  if (point.validSampleCount === 0) {
    return "missing"
  }

  if (point.validSampleCount < 8 || point.averageOffset === null) {
    return "poor"
  }

  if (point.averageOffset <= 0.07) {
    return "good"
  }

  if (point.averageOffset <= 0.13) {
    return "fair"
  }

  return "poor"
}

export function formatNormalizedMetric(value: number | null) {
  if (value === null) {
    return "-"
  }

  return `${(value * 100).toFixed(1)}%`
}

export function formatSignedNormalizedMetric(value: number | null) {
  if (value === null) {
    return "-"
  }

  const percent = (value * 100).toFixed(1)
  return `${value >= 0 ? "+" : ""}${percent}%`
}

export function formatTime(unixMs: number | null) {
  if (!unixMs) {
    return "-"
  }

  return new Date(unixMs).toLocaleTimeString()
}

export function getCalibrationApiErrorMessage(error: unknown) {
  if (typeof error !== "object" || !error) {
    return "Could not apply calibration. Please try again."
  }

  const errorRecord = error as { data?: unknown; message?: string }
  const data = errorRecord.data as { message?: string } | undefined

  if (typeof data?.message === "string" && data.message.length > 0) {
    return data.message
  }

  if (typeof errorRecord.message === "string" && errorRecord.message.length > 0) {
    return errorRecord.message
  }

  return "Could not apply calibration. Please try again."
}

export function getCalibrationProgress(
  runState: CalibrationRunState,
  activePointIndex: number,
  targetPhase: CalibrationTargetPhase
) {
  if (runState === "review") {
    return 100
  }

  if (activePointIndex < 0) {
    return 0
  }

  return (
    ((activePointIndex + (targetPhase === "capture" ? 0.8 : 0.45)) / CALIBRATION_POINTS.length) *
    100
  )
}

export function getCalibrationPointLabel(pointId: string) {
  return CALIBRATION_POINTS.find((point) => point.pointId === pointId)?.label ?? pointId
}

export function summarizeCalibrationRun(points: CalibrationPointPayload[]): CalibrationRunSummary {
  const validPoints = points.filter(
    (point) => point.centroidX !== null && point.centroidY !== null && point.averageOffset !== null
  )

  const averageOffset =
    validPoints.length > 0
      ? validPoints.reduce((sum, point) => sum + (point.averageOffset ?? 0), 0) / validPoints.length
      : null

  const averageSpread =
    validPoints.length > 0
      ? validPoints.reduce((sum, point) => sum + (point.averageSpread ?? 0), 0) / validPoints.length
      : null

  const offsetX =
    validPoints.length > 0
      ? validPoints.reduce((sum, point) => sum + (point.targetX - (point.centroidX ?? point.targetX)), 0) /
        validPoints.length
      : null

  const offsetY =
    validPoints.length > 0
      ? validPoints.reduce((sum, point) => sum + (point.targetY - (point.centroidY ?? point.targetY)), 0) /
        validPoints.length
      : null

  let quality: CalibrationRunSummary["quality"] = "unknown"
  if (averageOffset !== null) {
    if (averageOffset <= 0.07) {
      quality = "good"
    } else if (averageOffset <= 0.13) {
      quality = "fair"
    } else {
      quality = "poor"
    }
  }

  return {
    points,
    averageOffset,
    averageSpread,
    offsetX,
    offsetY,
    quality,
    validPointCount: validPoints.length,
  }
}
