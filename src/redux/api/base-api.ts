import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5190/api"

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ["Eyetracker", "Experiment"],
  endpoints: () => ({}),
})
