import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type ExperimentStepOneState = {
  serialNumber: string
  overwriteExistingLicence: boolean
  saveLicence: boolean
  licenceFileName: string | null
  lastSyncedFingerprint: string | null
}

type ExperimentStepTwoState = {
  name: string
  age: number
  sex: string
  eyeCondition: string
  readingProficiency: string
  lastSyncedFingerprint: string | null
}

type ExperimentStepThreeState = {
  externalCalibrationCompleted: boolean
  useLocalCalibration: boolean
  internalCalibrationStatus: "pending" | "skipped" | "completed"
  lastAppliedAtUnixMs: number | null
  lastQuality: "good" | "fair" | "poor" | "unknown" | null
  lastAverageOffset: number | null
  lastOffsetX: number | null
  lastOffsetY: number | null
}

type ExperimentState = {
  stepOne: ExperimentStepOneState
  stepTwo: ExperimentStepTwoState
  stepThree: ExperimentStepThreeState
}

export type PersistedStepThreeCalibrationState = Pick<
  ExperimentStepThreeState,
  | "useLocalCalibration"
  | "internalCalibrationStatus"
  | "lastAppliedAtUnixMs"
  | "lastQuality"
  | "lastAverageOffset"
  | "lastOffsetX"
  | "lastOffsetY"
>

const initialState: ExperimentState = {
  stepOne: {
    serialNumber: "",
    overwriteExistingLicence: false,
    saveLicence: false,
    licenceFileName: null,
    lastSyncedFingerprint: null,
  },
  stepTwo: {
    name: "",
    age: 18,
    sex: "",
    eyeCondition: "",
    readingProficiency: "",
    lastSyncedFingerprint: null,
  },
  stepThree: {
    externalCalibrationCompleted: false,
    useLocalCalibration: false,
    internalCalibrationStatus: "pending",
    lastAppliedAtUnixMs: null,
    lastQuality: null,
    lastAverageOffset: null,
    lastOffsetX: null,
    lastOffsetY: null,
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
    setStepThreeLastAverageOffset: (state, action: PayloadAction<number | null>) => {
      state.stepThree.lastAverageOffset = action.payload
    },
    setStepThreeLastOffsetX: (state, action: PayloadAction<number | null>) => {
      state.stepThree.lastOffsetX = action.payload
    },
    setStepThreeLastOffsetY: (state, action: PayloadAction<number | null>) => {
      state.stepThree.lastOffsetY = action.payload
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
    resetStepThreeState: (state) => {
      state.stepThree = initialState.stepThree
    },
  },
})

export const {
  setStepOneSerialNumber,
  setStepOneOverwriteExistingLicence,
  setStepOneSaveLicence,
  setStepOneLicenceFileName,
  setStepOneLastSyncedFingerprint,
  resetStepOneState,
  setStepTwoName,
  setStepTwoAge,
  setStepTwoSex,
  setStepTwoEyeCondition,
  setStepTwoReadingProficiency,
  setStepTwoLastSyncedFingerprint,
  resetStepTwoState,
  setStepThreeExternalCalibrationCompleted,
  setStepThreeUseLocalCalibration,
  setStepThreeInternalCalibrationStatus,
  setStepThreeLastAppliedAtUnixMs,
  setStepThreeLastQuality,
  setStepThreeLastAverageOffset,
  setStepThreeLastOffsetX,
  setStepThreeLastOffsetY,
  hydrateStepThreeCalibrationState,
  resetStepThreeState,
} = experimentSlice.actions

export default experimentSlice.reducer
