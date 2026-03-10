import type { ExperimentSessionSnapshot } from "@/lib/experiment-session"
import { baseApi } from "@/redux/api/base-api"

export const experimentSessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExperimentSession: builder.query<ExperimentSessionSnapshot, void>({
      query: () => "/experiment-session",
      providesTags: ["Experiment"],
    }),
  }),
})

export const { useGetExperimentSessionQuery } = experimentSessionApi
