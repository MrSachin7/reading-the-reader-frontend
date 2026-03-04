"use client"

import * as React from "react"
import { Provider } from "react-redux"

import { makeStore } from "@/redux/store"

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const [store] = React.useState(makeStore)

  return <Provider store={store}>{children}</Provider>
}
