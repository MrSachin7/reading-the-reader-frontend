import { combineReducers, configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"

import { baseApi } from "@/redux/api/base-api"
import experimentReducer from "@/redux/slices/experiment-slice"
import appReducer from "@/redux/slices/app-slice"

const rootReducer = combineReducers({
  app: appReducer,
  experiment: experimentReducer,
  [baseApi.reducerPath]: baseApi.reducer,
})

export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  })

  setupListeners(store.dispatch)
  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = AppStore["dispatch"]
