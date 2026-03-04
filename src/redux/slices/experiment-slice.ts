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

type ExperimentState = {
  stepOne: ExperimentStepOneState
  stepTwo: ExperimentStepTwoState
}

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
} = experimentSlice.actions

export default experimentSlice.reducer
