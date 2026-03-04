import { baseApi } from "@/redux/api/base-api"

export type Eyetracker = {
  name: string
  model: string
  serialNumber: string
}

type EyeTrackerApiResponse = {
  name?: string
  model?: string
  serialNumber?: string
  Name?: string
  Model?: string
  SerialNumber?: string
}

export const eyetrackerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEyetrackers: builder.query<Eyetracker[], void>({
      query: () => "/eyetrackers",
      transformResponse: (response: EyeTrackerApiResponse[]) =>
        response.map((item) => ({
          name: item.name ?? item.Name ?? "",
          model: item.model ?? item.Model ?? "",
          serialNumber: item.serialNumber ?? item.SerialNumber ?? "",
        })),
      providesTags: ["Eyetracker"],
    }),
  }),
})

export const { useGetEyetrackersQuery } = eyetrackerApi
