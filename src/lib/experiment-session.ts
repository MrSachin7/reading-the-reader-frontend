import type { CalibrationSessionSnapshot } from "@/lib/calibration"

export type ExperimentSetupSnapshot = {
  eyeTrackerSetupCompleted: boolean
  participantSetupCompleted: boolean
  calibrationCompleted: boolean
  currentStepIndex: number
}

export type ExperimentParticipantSnapshot = {
  name: string
  age: number
  sex: string
  existingEyeCondition: string
  readingProficiency: string
}

export type ExperimentEyeTrackerSnapshot = {
  name: string
  model: string
  serialNumber: string
  hasSavedLicence: boolean
}

export type ExperimentSessionSnapshot = {
  sessionId: string | null
  isActive: boolean
  startedAtUnixMs: number
  stoppedAtUnixMs: number | null
  participant: ExperimentParticipantSnapshot | null
  eyeTrackerDevice: ExperimentEyeTrackerSnapshot | null
  calibration: CalibrationSessionSnapshot
  setup: ExperimentSetupSnapshot
  receivedGazeSamples: number
  latestGazeSample: unknown
  connectedClients: number
}
