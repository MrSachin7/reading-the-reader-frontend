import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type ExperimentStepOneState = {
  serialNumber: string
  overwriteExistingLicence: boolean
  saveLicence: boolean
  licenceFileName: string | null
  lastSyncedFingerprint: string | null
}

type ExperimentState = {
  stepOne: ExperimentStepOneState
}

const initialState: ExperimentState = {
  stepOne: {
    serialNumber: "",
    overwriteExistingLicence: false,
    saveLicence: false,
    licenceFileName: null,
    lastSyncedFingerprint: null,
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
  },
})

export const {
  setStepOneSerialNumber,
  setStepOneOverwriteExistingLicence,
  setStepOneSaveLicence,
  setStepOneLicenceFileName,
  setStepOneLastSyncedFingerprint,
  resetStepOneState,
} = experimentSlice.actions

export default experimentSlice.reducer
