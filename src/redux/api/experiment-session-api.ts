import type { ExperimentSessionSnapshot } from "@/lib/experiment-session"
import { baseApi } from "@/redux/api/base-api"

export type UpsertReadingSessionPayload = {
  documentId: string
  title: string
  markdown: string
  sourceSetupId?: string | null
  fontFamily: string
  fontSizePx: number
  lineWidthPx: number
  lineHeight: number
  letterSpacingEm: number
  editableByResearcher: boolean
}

export const experimentSessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExperimentSession: builder.query<ExperimentSessionSnapshot, void>({
      query: () => "/experiment-session",
      providesTags: ["Experiment"],
    }),
    upsertReadingSession: builder.mutation<
      ExperimentSessionSnapshot,
      UpsertReadingSessionPayload
    >({
      query: (body) => ({
        url: "/experiment-session/reading-session",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Experiment"],
    }),
    startExperimentSession: builder.mutation<void, void>({
      query: () => ({
        url: "/eyetrackers/start",
        method: "POST",
      }),
      invalidatesTags: ["Experiment"],
    }),
    stopExperimentSession: builder.mutation<void, void>({
      query: () => ({
        url: "/eyetrackers/stop",
        method: "POST",
      }),
      invalidatesTags: ["Experiment"],
    }),
  }),
})

export const {
  useGetExperimentSessionQuery,
  useStartExperimentSessionMutation,
  useStopExperimentSessionMutation,
  useUpsertReadingSessionMutation,
} = experimentSessionApi
