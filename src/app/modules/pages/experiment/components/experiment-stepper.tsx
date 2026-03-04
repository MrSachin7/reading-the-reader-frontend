"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2, Crosshair, FileText, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Stepper,
  StepperHeader,
  StepperIcon,
  StepperItem,
  StepperSeparator,
} from "@/components/ui/stepper"

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

const eyetrackerOptions = [
  { value: "tobii-pro-fusion", label: "Tobii Pro Fusion" },
  { value: "tobii-pro-nano", label: "Tobii Pro Nano" },
  { value: "gazepoint-gp3", label: "Gazepoint GP3" },
  { value: "eye-tech-ds", label: "EyeTech Digital Systems" },
]

const steps: ExperimentStep[] = [
  { value: 0, name: "step1", label: "Choose eyetracker", icon: Crosshair },
  { value: 1, name: "step2", label: "step2", icon: FileText },
  { value: 2, name: "step3", label: "step3", icon: CheckCircle2 },
]

export function ExperimentStepper() {
  const [step, setStep] = React.useState(0)
  const [selectedEyetracker, setSelectedEyetracker] = React.useState("")
  const [licenseFile, setLicenseFile] = React.useState<File | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const selectedEyetrackerLabel = eyetrackerOptions.find(
    (item) => item.value === selectedEyetracker
  )?.label

  return (
    <div className="w-full space-y-8">
      <ExperimentStepNavigation step={step} onStepChange={setStep} steps={steps} />

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Step 1 setup</CardTitle>
          <CardDescription>
            Select an eyetracker and upload the matching license file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 ? (
            <>
              <section className="space-y-3 rounded-lg border p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Select an eyetracker</h3>
                  <p className="text-xs text-muted-foreground">
                    Choose the device model you want to use for this experiment.
                  </p>
                </div>
                <Label htmlFor="eyetracker">Eyetracker</Label>
                <Select value={selectedEyetracker} onValueChange={setSelectedEyetracker}>
                  <SelectTrigger id="eyetracker" className="w-full">
                    <SelectValue placeholder="Select an eyetracker" />
                  </SelectTrigger>
                  <SelectContent>
                    {eyetrackerOptions.map((eyetracker) => (
                      <SelectItem key={eyetracker.value} value={eyetracker.value}>
                        {eyetracker.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>

              {selectedEyetracker ? (
                <section className="space-y-3 rounded-lg border p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Upload license</h3>
                    <p className="text-xs text-muted-foreground">
                      Upload the license file for <span className="font-medium">{selectedEyetrackerLabel}</span>.
                    </p>
                  </div>
                  <Label>License file</Label>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault()
                      setDragActive(false)
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      setDragActive(false)
                      setLicenseFile(event.dataTransfer.files?.[0] ?? null)
                    }}
                    className={cn(
                      "flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/35 hover:border-primary/65"
                    )}
                  >
                    <Upload className="mb-3 h-7 w-7 text-muted-foreground" />
                    <p className="text-sm font-medium">Drag and drop your license file</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)}
                    />
                  </div>

                  {licenseFile ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                      <Badge variant="secondary">Uploaded</Badge>
                      <span className="font-medium">{licenseFile.name}</span>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Content for {steps[step]?.name} will be added next.
            </div>
          )}
        </CardContent>
      </Card>

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
