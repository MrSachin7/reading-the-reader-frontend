"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2, Crosshair, FileText } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import {
  setStepTwoAge,
  setStepTwoEyeCondition,
  setStepTwoLastSyncedFingerprint,
  setStepTwoName,
  setStepTwoReadingProficiency,
  setStepTwoSex,
  useAppDispatch,
  useAppSelector,
  useSaveParticipantMutation,
} from "@/redux"
import type { RootState } from "@/redux"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  { value: 1, name: "step2", label: "Participant info", icon: FileText },
  { value: 2, name: "step3", label: "step3", icon: CheckCircle2 },
]

const participantSexOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
]

const participantEyeConditionOptions = [
  { value: "none", label: "None" },
  { value: "myopia", label: "Myopia" },
  { value: "hyperopia", label: "Hyperopia" },
  { value: "astigmatism", label: "Astigmatism" },
  { value: "color-vision-deficiency", label: "Color vision deficiency" },
]

const participantReadingProficiencyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

const participantFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  age: z
    .number({ error: "Age is required." })
    .int("Age must be a whole number.")
    .min(5, "Age must be at least 5.")
    .max(120, "Age must be at most 120."),
  sex: z.string().min(1, "Please select sex."),
  eyeCondition: z.string().min(1, "Please select an eye condition."),
  readingProficiency: z.string().min(1, "Please select a reading proficiency level."),
})

type ParticipantInformationFormProps = {
  onCompletionChange?: (isComplete: boolean) => void
  onSubmitRequestChange?: (submitHandler: (() => Promise<boolean>) | null) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}

function getApiErrorMessage(error: unknown) {
  if (typeof error !== "object" || !error) {
    return "Failed to save participant. Please try again."
  }

  const errorRecord = error as { data?: unknown; message?: string }
  const data = errorRecord.data as { message?: string } | undefined

  if (typeof data?.message === "string" && data.message.length > 0) {
    return data.message
  }

  if (typeof errorRecord.message === "string" && errorRecord.message.length > 0) {
    return errorRecord.message
  }

  return "Failed to save participant. Please try again."
}

function ParticipantInformationForm({
  onCompletionChange,
  onSubmitRequestChange,
  onSubmittingChange,
}: ParticipantInformationFormProps) {
  const dispatch = useAppDispatch()
  const stepTwoDraft = useAppSelector((state: RootState) => state.experiment.stepTwo)
  const [saveParticipant, { isLoading: isSavingParticipant }] = useSaveParticipantMutation()

  const form = useForm<z.infer<typeof participantFormSchema>>({
    resolver: zodResolver(participantFormSchema),
    mode: "onChange",
    defaultValues: {
      name: stepTwoDraft.name,
      age: stepTwoDraft.age,
      sex: stepTwoDraft.sex,
      eyeCondition: stepTwoDraft.eyeCondition,
      readingProficiency: stepTwoDraft.readingProficiency,
    },
  })

  const watchedName = useWatch({ control: form.control, name: "name" })
  const watchedAge = useWatch({ control: form.control, name: "age" })
  const watchedSex = useWatch({ control: form.control, name: "sex" })
  const watchedEyeCondition = useWatch({ control: form.control, name: "eyeCondition" })
  const watchedReadingProficiency = useWatch({
    control: form.control,
    name: "readingProficiency",
  })

  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const isComplete = participantFormSchema.safeParse({
    name: watchedName,
    age: watchedAge,
    sex: watchedSex,
    eyeCondition: watchedEyeCondition,
    readingProficiency: watchedReadingProficiency,
  }).success

  React.useEffect(() => {
    dispatch(setStepTwoName(watchedName ?? ""))
  }, [dispatch, watchedName])

  React.useEffect(() => {
    dispatch(setStepTwoAge(Number(watchedAge) || 0))
  }, [dispatch, watchedAge])

  React.useEffect(() => {
    dispatch(setStepTwoSex(watchedSex ?? ""))
  }, [dispatch, watchedSex])

  React.useEffect(() => {
    dispatch(setStepTwoEyeCondition(watchedEyeCondition ?? ""))
  }, [dispatch, watchedEyeCondition])

  React.useEffect(() => {
    dispatch(setStepTwoReadingProficiency(watchedReadingProficiency ?? ""))
  }, [dispatch, watchedReadingProficiency])

  const submitParticipantForm = React.useCallback(async () => {
    setSubmitError(null)

    const isValid = await form.trigger()
    if (!isValid) {
      return false
    }

    const data = form.getValues()
    const currentFingerprint = JSON.stringify(data)

    if (stepTwoDraft.lastSyncedFingerprint === currentFingerprint) {
      return true
    }

    try {
      await saveParticipant({
        name: data.name,
        age: data.age,
        sex: data.sex,
        existingEyeCondition: data.eyeCondition,
        readingProficiency: data.readingProficiency,
      }).unwrap()
      dispatch(setStepTwoLastSyncedFingerprint(currentFingerprint))
      return true
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
      return false
    }
  }, [dispatch, form, saveParticipant, stepTwoDraft.lastSyncedFingerprint])

  React.useEffect(() => {
    onCompletionChange?.(isComplete)
  }, [isComplete, onCompletionChange])

  React.useEffect(() => {
    onSubmittingChange?.(isSavingParticipant)
    return () => onSubmittingChange?.(false)
  }, [isSavingParticipant, onSubmittingChange])

  React.useEffect(() => {
    onSubmitRequestChange?.(submitParticipantForm)
    return () => onSubmitRequestChange?.(null)
  }, [onSubmitRequestChange, submitParticipantForm])

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <form id="participant-info-form" onSubmit={(event) => event.preventDefault()}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="participant-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="participant-name"
                    placeholder="Enter participant name"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="age"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="participant-age">Age</FieldLabel>
                  <Input
                    id="participant-age"
                    type="number"
                    min={5}
                    max={120}
                    value={field.value}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="sex"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="participant-sex">Sex</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="participant-sex" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      {participantSexOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="eyeCondition"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="participant-eye-condition">Existing eye condition</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="participant-eye-condition"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select eye condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {participantEyeConditionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="readingProficiency"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="participant-reading-proficiency">Reading proficiency</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="participant-reading-proficiency"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select reading proficiency" />
                    </SelectTrigger>
                    <SelectContent>
                      {participantReadingProficiencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Choose the participant&apos;s reading level for baseline grouping.
                  </FieldDescription>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        {submitError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not continue</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function ExperimentStepper() {
  const [step, setStep] = React.useState(0)
  const [isStepSubmitting, setIsStepSubmitting] = React.useState(false)
  const [stepCompletion, setStepCompletion] = React.useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
  })
  const stepSubmitHandlerRef = React.useRef<(() => Promise<boolean>) | null>(null)

  const isCurrentStepComplete = stepCompletion[step] ?? false
  const canAdvance = isCurrentStepComplete && !isStepSubmitting

  const handleNext = async () => {
    if (step === steps.length - 1 || !canAdvance) {
      return
    }

    const submitStep = stepSubmitHandlerRef.current
    if (submitStep) {
      const success = await submitStep()
      if (!success) {
        return
      }
    }

    setStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  return (
    <div className="w-full space-y-8">
      <ExperimentStepNavigation step={step} onStepChange={setStep} steps={steps} />

      {step === 0 ? (
        <EyetrackerSetup
          onCompletionChange={(isComplete) =>
            setStepCompletion((prev) => ({ ...prev, 0: isComplete }))
          }
          onSubmittingChange={setIsStepSubmitting}
          onSubmitRequestChange={(submitHandler) => {
            stepSubmitHandlerRef.current = submitHandler
          }}
        />
      ) : step === 1 ? (
        <ParticipantInformationForm
          onCompletionChange={(isComplete) =>
            setStepCompletion((prev) => ({ ...prev, 1: isComplete }))
          }
          onSubmittingChange={setIsStepSubmitting}
          onSubmitRequestChange={(submitHandler) => {
            stepSubmitHandlerRef.current = submitHandler
          }}
        />
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
        <Button
          disabled={step === steps.length - 1 || !canAdvance}
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
