import { baseApi } from "@/redux/api/base-api"
import type { GazeData } from "@/lib/gaze-socket"

export type CalibrationPattern = "screen-based-five-point"

export type CalibrationPointPayload = {
  pointId: string
  targetX: number
  targetY: number
  startedAtUnixMs: number
  completedAtUnixMs: number
  sampleCount: number
  validSampleCount: number
  centroidX: number | null
  centroidY: number | null
  averageOffset: number | null
  averageSpread: number | null
  samples: GazeData[]
}

export type ApplyCalibrationPayload = {
  externalCalibrationCompleted: boolean
  pattern: CalibrationPattern
  stimulusAreaWidthPx: number
  stimulusAreaHeightPx: number
  collectedAtUnixMs: number
  validationRequested: boolean
  notes: string[]
  points: CalibrationPointPayload[]
}

export type ApplyCalibrationResponse = {
  status: "applied" | "accepted" | "rejected"
  calibrationId: string | null
  appliedAtUnixMs: number | null
  notes: string[]
  quality: {
    overall: "good" | "fair" | "poor" | "unknown"
    averageOffset: number | null
    averageSpread: number | null
  } | null
  validation: {
    averageAccuracyDegrees: number | null
    averagePrecisionDegrees: number | null
    notes: string[]
  } | null
}

export const calibrationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    applyCalibration: builder.mutation<ApplyCalibrationResponse, ApplyCalibrationPayload>({
      query: ({
        externalCalibrationCompleted,
        pattern,
        stimulusAreaWidthPx,
        stimulusAreaHeightPx,
        collectedAtUnixMs,
        validationRequested,
        notes,
        points,
      }) => ({
        url: "/calibration/apply",
        method: "POST",
        body: {
          ExternalCalibrationCompleted: externalCalibrationCompleted,
          Pattern: pattern,
          StimulusAreaWidthPx: stimulusAreaWidthPx,
          StimulusAreaHeightPx: stimulusAreaHeightPx,
          CollectedAtUnixMs: collectedAtUnixMs,
          ValidationRequested: validationRequested,
          Notes: notes,
          Points: points.map((point) => ({
            PointId: point.pointId,
            TargetX: point.targetX,
            TargetY: point.targetY,
            StartedAtUnixMs: point.startedAtUnixMs,
            CompletedAtUnixMs: point.completedAtUnixMs,
            SampleCount: point.sampleCount,
            ValidSampleCount: point.validSampleCount,
            CentroidX: point.centroidX,
            CentroidY: point.centroidY,
            AverageOffset: point.averageOffset,
            AverageSpread: point.averageSpread,
            Samples: point.samples.map((sample) => ({
              DeviceTimeStamp: sample.deviceTimeStamp,
              LeftEyeX: sample.leftEyeX,
              LeftEyeY: sample.leftEyeY,
              LeftEyeValidity: sample.leftEyeValidity,
              RightEyeX: sample.rightEyeX,
              RightEyeY: sample.rightEyeY,
              RightEyeValidity: sample.rightEyeValidity,
            })),
          })),
        },
      }),
    }),
  }),
})

export const { useApplyCalibrationMutation } = calibrationApi
