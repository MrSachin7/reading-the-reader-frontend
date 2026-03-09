export type NormalizedPoint = {
  x: number
  y: number
}

export type TimedPoint = NormalizedPoint & {
  capturedAtUnixMs: number
}

export type CalibrationPoint = {
  id: string
  label: string
  x: number
  y: number
}

export type CalibrationPointResult = {
  id: string
  label: string
  target: NormalizedPoint
  centroid: NormalizedPoint | null
  spread: number | null
  offsetX: number | null
  offsetY: number | null
  sampleCount: number
}

export type CalibrationTargetPhase = "move" | "settle" | "hold" | "burst"

export type CalibrationSummary = {
  points: CalibrationPointResult[]
  offsetX: number | null
  offsetY: number | null
  averageOffset: number | null
  averageSpread: number | null
  quality: "good" | "fair" | "poor" | "unknown"
  validPointCount: number
}

export const CALIBRATION_POINTS: CalibrationPoint[] = [
  { id: "center", label: "Center", x: 0.5, y: 0.5 },
  { id: "top-left", label: "Top left", x: 0.16, y: 0.16 },
  { id: "top-center", label: "Top center", x: 0.5, y: 0.14 },
  { id: "top-right", label: "Top right", x: 0.84, y: 0.16 },
  { id: "middle-right", label: "Middle right", x: 0.86, y: 0.5 },
  { id: "bottom-right", label: "Bottom right", x: 0.84, y: 0.84 },
  { id: "bottom-center", label: "Bottom center", x: 0.5, y: 0.86 },
  { id: "bottom-left", label: "Bottom left", x: 0.16, y: 0.84 },
  { id: "middle-left", label: "Middle left", x: 0.14, y: 0.5 },
]

export const TARGET_MOVE_MS = 900
export const TARGET_SETTLE_MS = 650
export const TARGET_CAPTURE_TIMEOUT_MS = 3200
export const TARGET_BURST_MS = 220
export const STABLE_WINDOW_SIZE = 22
export const MIN_CAPTURE_POINTS = 16
export const STABLE_SPREAD_THRESHOLD = 0.022
export const STABLE_HOLD_DURATION_MS = 320

export function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}

export function formatPercent(value: number | null) {
  if (value === null) {
    return "-"
  }

  return `${(value * 100).toFixed(1)}%`
}

export function formatSignedPercent(value: number | null) {
  if (value === null) {
    return "-"
  }

  const percent = (value * 100).toFixed(1)
  return `${value >= 0 ? "+" : ""}${percent}%`
}

export function formatQualityLabel(value: CalibrationSummary["quality"]) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function distance(a: NormalizedPoint, b: NormalizedPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function averagePoint(points: TimedPoint[]) {
  if (points.length === 0) {
    return null
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  }
}

function averageSpread(points: TimedPoint[], centroid: NormalizedPoint | null) {
  if (!centroid || points.length === 0) {
    return null
  }

  return points.reduce((sum, point) => sum + distance(point, centroid), 0) / points.length
}

type StableWindow = {
  centroid: NormalizedPoint
  spread: number
  sampleCount: number
}

export function findStableWindow(points: TimedPoint[]): StableWindow | null {
  if (points.length < MIN_CAPTURE_POINTS) {
    return null
  }

  let bestWindow: StableWindow | null = null

  for (let endIndex = STABLE_WINDOW_SIZE; endIndex <= points.length; endIndex += 1) {
    const windowPoints = points.slice(endIndex - STABLE_WINDOW_SIZE, endIndex)
    const centroid = averagePoint(windowPoints)
    const spread = averageSpread(windowPoints, centroid)

    if (!centroid || spread === null) {
      continue
    }

    const nextWindow = {
      centroid,
      spread,
      sampleCount: windowPoints.length,
    }

    if (!bestWindow || nextWindow.spread < bestWindow.spread) {
      bestWindow = nextWindow
    }
  }

  if (!bestWindow) {
    return null
  }

  if (bestWindow.spread <= STABLE_SPREAD_THRESHOLD) {
    return bestWindow
  }

  return bestWindow
}

export function summarizeCalibrationPoint(
  point: CalibrationPoint,
  capturedPoints: TimedPoint[]
): CalibrationPointResult {
  const stableWindow = findStableWindow(capturedPoints)

  if (!stableWindow) {
    return {
      id: point.id,
      label: point.label,
      target: { x: point.x, y: point.y },
      centroid: null,
      spread: null,
      offsetX: null,
      offsetY: null,
      sampleCount: capturedPoints.length,
    }
  }

  return {
    id: point.id,
    label: point.label,
    target: { x: point.x, y: point.y },
    centroid: stableWindow.centroid,
    spread: stableWindow.spread,
    offsetX: point.x - stableWindow.centroid.x,
    offsetY: point.y - stableWindow.centroid.y,
    sampleCount: stableWindow.sampleCount,
  }
}

export function summarizeCalibration(points: CalibrationPointResult[]): CalibrationSummary {
  const validPoints = points.filter(
    (point) =>
      point.centroid !== null &&
      point.spread !== null &&
      point.offsetX !== null &&
      point.offsetY !== null
  )

  const offsetX =
    validPoints.length > 0
      ? validPoints.reduce((sum, point) => sum + (point.offsetX ?? 0), 0) / validPoints.length
      : null

  const offsetY =
    validPoints.length > 0
      ? validPoints.reduce((sum, point) => sum + (point.offsetY ?? 0), 0) / validPoints.length
      : null

  const averageOffset =
    validPoints.length > 0
      ? validPoints.reduce(
          (sum, point) =>
            sum +
            Math.hypot(point.offsetX ?? 0, point.offsetY ?? 0),
          0
        ) / validPoints.length
      : null

  const averageSpread =
    validPoints.length > 0
      ? validPoints.reduce((sum, point) => sum + (point.spread ?? 0), 0) / validPoints.length
      : null

  let quality: CalibrationSummary["quality"] = "unknown"
  if (averageOffset !== null) {
    if (averageOffset <= 0.06) {
      quality = "good"
    } else if (averageOffset <= 0.12) {
      quality = "fair"
    } else {
      quality = "poor"
    }
  }

  return {
    points,
    offsetX,
    offsetY,
    averageOffset,
    averageSpread,
    quality,
    validPointCount: validPoints.length,
  }
}
