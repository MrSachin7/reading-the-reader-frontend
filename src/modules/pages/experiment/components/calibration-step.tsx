"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"

import {
  setStepThreeExternalCalibrationCompleted,
  setStepThreeUseLocalCalibration,
  useAppDispatch,
  useAppSelector,
} from "@/redux"
import type { RootState } from "@/redux"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { type CalibrationStepProps } from "./utils"

export function CalibrationStep({
  onCompletionChange,
  onSubmitRequestChange,
  onSubmittingChange,
}: CalibrationStepProps) {
  const dispatch = useAppDispatch()
  const stepThree = useAppSelector((state: RootState) => state.experiment.stepThree)

  const isComplete = stepThree.externalCalibrationCompleted

  React.useEffect(() => {
    onCompletionChange?.(isComplete)
  }, [isComplete, onCompletionChange])

  React.useEffect(() => {
    onSubmitRequestChange?.(null)
    return () => onSubmitRequestChange?.(null)
  }, [onSubmitRequestChange])

  React.useEffect(() => {
    onSubmittingChange?.(false)
    return () => onSubmittingChange?.(false)
  }, [onSubmittingChange])

  const handleExternalCalibrationChange = (checked: boolean) => {
    dispatch(setStepThreeExternalCalibrationCompleted(checked))

    if (!checked) {
      dispatch(setStepThreeUseLocalCalibration(false))
    }
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Step 3</Badge>
          <Badge variant="outline">Calibration</Badge>
        </div>
        <CardTitle className="mt-3 text-3xl tracking-tight">
          Confirm that Tobii calibration has been completed.
        </CardTitle>
        <CardDescription className="max-w-3xl text-base leading-7">
          This step is currently used as an operator reminder. Make sure the participant has
          completed the Tobii calibration in the external software, then confirm it here.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-8">
        <div className="rounded-[1.75rem] border bg-muted/20 p-6">
          <label className="flex cursor-pointer items-start gap-4">
            <Checkbox
              checked={stepThree.externalCalibrationCompleted}
              onCheckedChange={(checked) => handleExternalCalibrationChange(Boolean(checked))}
              className="mt-1"
            />
            <div className="min-w-0">
              <p className="text-base font-semibold">The external Tobii calibration is done.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This app cannot detect that automatically. Check this only after the participant has
                completed calibration in the Tobii software and you are satisfied with that result.
              </p>
            </div>
          </label>
        </div>

        {stepThree.externalCalibrationCompleted ? (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-400/30 bg-emerald-500/5 p-4 text-emerald-900 dark:text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Calibration confirmed</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                The experiment will continue using the Tobii calibration.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
