import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { ExperimentSessionSnapshot } from "@/lib/experiment-session"

type ExperimentStepOneState = {
  serialNumber: string
  overwriteExistingLicence: boolean
  saveLicence: boolean
  licenceFileName: string | null
  selectionConfirmed: boolean
  lastSyncedFingerprint: string | null
}

type ExperimentStepTwoState = {
  name: string
  age: number
  sex: string
  eyeCondition: string
  readingProficiency: string
  participantConfirmed: boolean
  lastSyncedFingerprint: string | null
}

type ExperimentStepThreeState = {
  externalCalibrationCompleted: boolean
  useLocalCalibration: boolean
  internalCalibrationStatus: "pending" | "running" | "failed" | "completed"
  lastAppliedAtUnixMs: number | null
  lastQuality: "good" | "fair" | "poor" | "unknown" | null
  lastCalibrationSessionId: string | null
  lastCalibrationStatus: string | null
}

type ReadingSessionState = {
  source: "preset" | "custom"
  customMarkdown: string
  researcherQuestions: string
}

type ExperimentState = {
  stepOne: ExperimentStepOneState
  stepTwo: ExperimentStepTwoState
  stepThree: ExperimentStepThreeState
  readingSession: ReadingSessionState
}

export type PersistedStepThreeCalibrationState = Pick<
  ExperimentStepThreeState,
  | "useLocalCalibration"
  | "internalCalibrationStatus"
  | "lastAppliedAtUnixMs"
  | "lastQuality"
  | "lastCalibrationSessionId"
  | "lastCalibrationStatus"
>

const initialState: ExperimentState = {
  stepOne: {
    serialNumber: "",
    overwriteExistingLicence: false,
    saveLicence: false,
    licenceFileName: null,
    selectionConfirmed: false,
    lastSyncedFingerprint: null,
  },
  stepTwo: {
    name: "",
    age: 18,
    sex: "",
    eyeCondition: "",
    readingProficiency: "",
    participantConfirmed: false,
    lastSyncedFingerprint: null,
  },
  stepThree: {
    externalCalibrationCompleted: false,
    useLocalCalibration: false,
    internalCalibrationStatus: "pending",
    lastAppliedAtUnixMs: null,
    lastQuality: null,
    lastCalibrationSessionId: null,
    lastCalibrationStatus: null,
  },
  readingSession: {
    source: "preset",
    customMarkdown: "",
    researcherQuestions: "",
  },
}

const experimentSlice = createSlice({
  name: "experiment",
  initialState,
  reducers: {
    setStepOneSerialNumber: (state, action: PayloadAction<string>) => {
      state.stepOne.serialNumber = action.payload
    },
    setStepOneOverwriteExistingLicence: (state, action: PayloadAction<boolean>) => {
      state.stepOne.overwriteExistingLicence = action.payload
    },
    setStepOneSaveLicence: (state, action: PayloadAction<boolean>) => {
      state.stepOne.saveLicence = action.payload
    },
    setStepOneLicenceFileName: (state, action: PayloadAction<string | null>) => {
      state.stepOne.licenceFileName = action.payload
    },
    setStepOneSelectionConfirmed: (state, action: PayloadAction<boolean>) => {
      state.stepOne.selectionConfirmed = action.payload
    },
    setStepOneLastSyncedFingerprint: (state, action: PayloadAction<string | null>) => {
      state.stepOne.lastSyncedFingerprint = action.payload
    },
    resetStepOneState: (state) => {
      state.stepOne = initialState.stepOne
    },
    setStepTwoName: (state, action: PayloadAction<string>) => {
      state.stepTwo.name = action.payload
    },
    setStepTwoAge: (state, action: PayloadAction<number>) => {
      state.stepTwo.age = action.payload
    },
    setStepTwoSex: (state, action: PayloadAction<string>) => {
      state.stepTwo.sex = action.payload
    },
    setStepTwoEyeCondition: (state, action: PayloadAction<string>) => {
      state.stepTwo.eyeCondition = action.payload
    },
    setStepTwoReadingProficiency: (state, action: PayloadAction<string>) => {
      state.stepTwo.readingProficiency = action.payload
    },
    setStepTwoParticipantConfirmed: (state, action: PayloadAction<boolean>) => {
      state.stepTwo.participantConfirmed = action.payload
    },
    setStepTwoLastSyncedFingerprint: (state, action: PayloadAction<string | null>) => {
      state.stepTwo.lastSyncedFingerprint = action.payload
    },
    resetStepTwoState: (state) => {
      state.stepTwo = initialState.stepTwo
    },
    setStepThreeExternalCalibrationCompleted: (state, action: PayloadAction<boolean>) => {
      state.stepThree.externalCalibrationCompleted = action.payload
    },
    setStepThreeUseLocalCalibration: (state, action: PayloadAction<boolean>) => {
      state.stepThree.useLocalCalibration = action.payload
    },
    setStepThreeInternalCalibrationStatus: (
      state,
      action: PayloadAction<ExperimentStepThreeState["internalCalibrationStatus"]>
    ) => {
      state.stepThree.internalCalibrationStatus = action.payload
    },
    setStepThreeLastAppliedAtUnixMs: (state, action: PayloadAction<number | null>) => {
      state.stepThree.lastAppliedAtUnixMs = action.payload
    },
    setStepThreeLastQuality: (
      state,
      action: PayloadAction<ExperimentStepThreeState["lastQuality"]>
    ) => {
      state.stepThree.lastQuality = action.payload
    },
    setStepThreeLastCalibrationSessionId: (state, action: PayloadAction<string | null>) => {
      state.stepThree.lastCalibrationSessionId = action.payload
    },
    setStepThreeLastCalibrationStatus: (state, action: PayloadAction<string | null>) => {
      state.stepThree.lastCalibrationStatus = action.payload
    },
    hydrateStepThreeCalibrationState: (
      state,
      action: PayloadAction<PersistedStepThreeCalibrationState>
    ) => {
      state.stepThree = {
        ...state.stepThree,
        ...action.payload,
      }
    },
    hydrateExperimentFromSession: (
      state,
      action: PayloadAction<ExperimentSessionSnapshot>
    ) => {
      const session = action.payload
      const participant = session.participant
      const eyeTracker = session.eyeTrackerDevice
      const calibration = session.calibration
      const eyeTrackerFingerprint = eyeTracker
        ? JSON.stringify({
            serialNumber: eyeTracker.serialNumber,
            overwriteExistingLicence: false,
            saveLicence: false,
            licenceFileName: null,
          })
        : null
      const participantFingerprint = participant
        ? JSON.stringify({
            name: participant.name,
            age: participant.age,
            sex: participant.sex,
            eyeCondition: participant.existingEyeCondition,
            readingProficiency: participant.readingProficiency,
          })
        : null

      state.stepOne = {
        ...state.stepOne,
        serialNumber: eyeTracker?.serialNumber ?? "",
        overwriteExistingLicence: false,
        saveLicence: false,
        licenceFileName: null,
        selectionConfirmed: session.setup.eyeTrackerSetupCompleted,
        lastSyncedFingerprint: eyeTrackerFingerprint,
      }

      state.stepTwo = {
        ...state.stepTwo,
        name: participant?.name ?? "",
        age: participant?.age ?? 18,
        sex: participant?.sex ?? "",
        eyeCondition: participant?.existingEyeCondition ?? "",
        readingProficiency: participant?.readingProficiency ?? "",
        participantConfirmed: session.setup.participantSetupCompleted,
        lastSyncedFingerprint: participantFingerprint,
      }

      state.stepThree = {
        ...state.stepThree,
        externalCalibrationCompleted: session.setup.calibrationCompleted,
        useLocalCalibration: false,
        internalCalibrationStatus:
          calibration.status === "completed"
            ? "completed"
            : calibration.status === "running"
              ? "running"
              : calibration.status === "failed" || calibration.status === "cancelled"
                ? "failed"
                : "pending",
        lastAppliedAtUnixMs: session.setup.calibrationCompleted
          ? calibration.completedAtUnixMs
          : null,
        lastQuality: session.setup.calibrationCompleted ? "unknown" : null,
        lastCalibrationSessionId: calibration.sessionId,
        lastCalibrationStatus: calibration.result?.status ?? calibration.status,
      }
    },
    resetStepThreeState: (state) => {
      state.stepThree = initialState.stepThree
    },
    setReadingSessionSource: (
      state,
      action: PayloadAction<ReadingSessionState["source"]>
    ) => {
      state.readingSession.source = action.payload
    },
    setReadingSessionCustomMarkdown: (state, action: PayloadAction<string>) => {
      state.readingSession.customMarkdown = action.payload
    },
    setReadingSessionResearcherQuestions: (state, action: PayloadAction<string>) => {
      state.readingSession.researcherQuestions = action.payload
    },
    resetReadingSessionState: (state) => {
      state.readingSession = initialState.readingSession
    },
  },
})

export const {
  setStepOneSerialNumber,
  setStepOneOverwriteExistingLicence,
  setStepOneSaveLicence,
  setStepOneLicenceFileName,
  setStepOneSelectionConfirmed,
  setStepOneLastSyncedFingerprint,
  resetStepOneState,
  setStepTwoName,
  setStepTwoAge,
  setStepTwoSex,
  setStepTwoEyeCondition,
  setStepTwoReadingProficiency,
  setStepTwoParticipantConfirmed,
  setStepTwoLastSyncedFingerprint,
  resetStepTwoState,
  setStepThreeExternalCalibrationCompleted,
  setStepThreeUseLocalCalibration,
  setStepThreeInternalCalibrationStatus,
  setStepThreeLastAppliedAtUnixMs,
  setStepThreeLastQuality,
  setStepThreeLastCalibrationSessionId,
  setStepThreeLastCalibrationStatus,
  hydrateExperimentFromSession,
  hydrateStepThreeCalibrationState,
  resetStepThreeState,
  setReadingSessionSource,
  setReadingSessionCustomMarkdown,
  setReadingSessionResearcherQuestions,
  resetReadingSessionState,
} = experimentSlice.actions

export default experimentSlice.reducer
