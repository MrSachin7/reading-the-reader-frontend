import { baseApi } from "@/redux/api/base-api"
import type { CalibrationSessionSnapshot } from "@/lib/calibration"

export const calibrationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCalibrationState: builder.query<CalibrationSessionSnapshot, void>({
      query: () => "/calibration",
    }),
    startCalibration: builder.mutation<CalibrationSessionSnapshot, void>({
      query: () => ({
        url: "/calibration/start",
        method: "POST",
      }),
      invalidatesTags: ["Experiment"],
    }),
    collectCalibrationPoint: builder.mutation<CalibrationSessionSnapshot, { pointId: string }>({
      query: ({ pointId }) => ({
        url: "/calibration/collect",
        method: "POST",
        body: {
          PointId: pointId,
        },
      }),
      invalidatesTags: ["Experiment"],
    }),
    finishCalibration: builder.mutation<CalibrationSessionSnapshot, void>({
      query: () => ({
        url: "/calibration/finish",
        method: "POST",
      }),
      invalidatesTags: ["Experiment"],
    }),
    cancelCalibration: builder.mutation<CalibrationSessionSnapshot, void>({
      query: () => ({
        url: "/calibration/cancel",
        method: "POST",
      }),
      invalidatesTags: ["Experiment"],
    }),
  }),
})

export const {
  useGetCalibrationStateQuery,
  useStartCalibrationMutation,
  useCollectCalibrationPointMutation,
  useFinishCalibrationMutation,
  useCancelCalibrationMutation,
} = calibrationApi
