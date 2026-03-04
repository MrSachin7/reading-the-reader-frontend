"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2, Crosshair, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Stepper,
  StepperHeader,
  StepperIcon,
  StepperItem,
  StepperSeparator,
} from "@/components/ui/stepper"
import { EyetrackerSetup } from "./eyetracker-setup"

export type ExperimentStep = {
  value: number
  name: string
  label: string
  icon: LucideIcon
}

type ExperimentStepNavigationProps = {
  step: number
  onStepChange: (value: number) => void
  steps: ExperimentStep[]
}

export function ExperimentStepNavigation({
  step,
  onStepChange,
  steps,
}: ExperimentStepNavigationProps) {
  return (
    <Stepper value={step} onChange={onStepChange} className="relative flex items-center">
      {steps.map((stepItem, index) => {
        const isLast = index === steps.length - 1
        const Icon = stepItem.icon
        const isActive = step === stepItem.value
        const isCompleted = step > stepItem.value

        return (
          <StepperItem
            key={stepItem.value}
            value={stepItem.value}
            disabled={step < stepItem.value}
            className="flex-1"
          >
            <StepperHeader className="flex w-full items-center">
              <StepperIcon
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-neutral-300 bg-neutral-100 text-neutral-400"
                )}
              >
                <Icon className="h-5 w-5" />
              </StepperIcon>
              <div className="ml-3 mr-2 min-w-0">
                <p className="truncate text-sm font-semibold">{stepItem.label}</p>
                <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                  {stepItem.name}
                </p>
              </div>
              {!isLast ? (
                <StepperSeparator
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors",
                    isCompleted ? "bg-primary" : "bg-neutral-200"
                  )}
                />
              ) : null}
            </StepperHeader>
          </StepperItem>
        )
      })}
    </Stepper>
  )
}

const steps: ExperimentStep[] = [
  { value: 0, name: "step1", label: "Choose eyetracker", icon: Crosshair },
  { value: 1, name: "step2", label: "step2", icon: FileText },
  { value: 2, name: "step3", label: "step3", icon: CheckCircle2 },
]

export function ExperimentStepper() {
  const [step, setStep] = React.useState(0)

  return (
    <div className="w-full space-y-8">
      <ExperimentStepNavigation step={step} onStepChange={setStep} steps={steps} />

      {step === 0 ? (
        <EyetrackerSetup />
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Content for {steps[step]?.name} will be added next.
          </CardContent>
        </Card>
      )}

      <div className="flex w-full justify-between gap-4">
        <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
          Previous
        </Button>
        <Button disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
