export type CalibrationPattern = "screen-based-five-point"

export type CalibrationPointState = {
  pointId: string
  label: string
  x: number
  y: number
  status: "pending" | "collecting" | "collected" | "failed"
  attempts: number
  collectedAtUnixMs: number | null
  hardwareStatus: string | null
  notes: string[]
}

export type CalibrationRunResult = {
  status: string
  applied: boolean
  calibrationPointCount: number
  notes: string[]
}

export type CalibrationSessionStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

export type CalibrationSessionSnapshot = {
  sessionId: string | null
  status: CalibrationSessionStatus
  pattern: CalibrationPattern
  startedAtUnixMs: number | null
  updatedAtUnixMs: number | null
  completedAtUnixMs: number | null
  points: CalibrationPointState[]
  result: CalibrationRunResult | null
  notes: string[]
}
