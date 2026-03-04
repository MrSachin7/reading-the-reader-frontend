"use client"

import * as React from "react"
import { AlertCircle, Crosshair, FileCheck2, Info, RefreshCw, Upload, X } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import { useGetEyetrackersQuery, useSelectEyetrackerMutation } from "@/redux"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type EyetrackerSetupFormValues = {
  serialNumber: string
  overwriteExistingLicence: boolean
  saveLicence: boolean
  licenceFile: File | null
}

type EyetrackerSetupProps = {
  onCompletionChange?: (isComplete: boolean) => void
  onSubmitRequestChange?: (submitHandler: (() => Promise<boolean>) | null) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}

function getApiErrorMessage(error: unknown) {
  if (typeof error !== "object" || !error) {
    return "Failed to select eyetracker. Please try again."
  }

  const errorRecord = error as { data?: unknown; message?: string }
  const data = errorRecord.data as { message?: string } | undefined

  if (typeof data?.message === "string" && data.message.length > 0) {
    return data.message
  }

  if (typeof errorRecord.message === "string" && errorRecord.message.length > 0) {
    return errorRecord.message
  }

  return "Failed to select eyetracker. Please try again."
}

export function EyetrackerSetup({
  onCompletionChange,
  onSubmitRequestChange,
  onSubmittingChange,
}: EyetrackerSetupProps) {
  const { data: eyetrackers = [], isLoading, isError, refetch } = useGetEyetrackersQuery()
  const [selectEyetracker, { isLoading: isSelecting }] = useSelectEyetrackerMutation()

  const form = useForm<EyetrackerSetupFormValues>({
    defaultValues: {
      serialNumber: "",
      overwriteExistingLicence: false,
      saveLicence: false,
      licenceFile: null,
    },
  })

  const selectedSerialNumber = useWatch({ control: form.control, name: "serialNumber" })
  const overwriteExistingLicence = useWatch({
    control: form.control,
    name: "overwriteExistingLicence",
  })
  const licenceFile = useWatch({ control: form.control, name: "licenceFile" })
  const saveLicence = useWatch({ control: form.control, name: "saveLicence" })

  const [dragActive, setDragActive] = React.useState(false)
  const [isReloadAnimating, setIsReloadAnimating] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const reloadAnimationTimeoutRef = React.useRef<number | null>(null)

  const eyetrackerOptions = React.useMemo(
    () =>
      eyetrackers.map((eyetracker) => {
        const value = eyetracker.serialNumber
        const label = `${eyetracker.name} / ${eyetracker.model} / ${eyetracker.serialNumber}`
        return {
          value,
          label,
          isSelectable: Boolean(eyetracker.serialNumber),
        }
      }),
    [eyetrackers]
  )

  const selectedEyetrackerLabel = eyetrackerOptions.find(
    (item) => item.value === selectedSerialNumber
  )?.label
  const selectedEyetracker = eyetrackers.find(
    (item) => item.serialNumber === selectedSerialNumber
  )
  const hasSavedLicence = Boolean(selectedEyetracker?.hasSavedLicence)
  const canUploadNewLicense = !hasSavedLicence || overwriteExistingLicence
  const isComplete = Boolean(
    selectedSerialNumber &&
      (licenceFile || (hasSavedLicence && !overwriteExistingLicence))
  )

  React.useEffect(() => {
    onCompletionChange?.(isComplete)
  }, [isComplete, onCompletionChange])

  React.useEffect(() => {
    onSubmittingChange?.(isSelecting)
    return () => onSubmittingChange?.(false)
  }, [isSelecting, onSubmittingChange])

  React.useEffect(() => {
    return () => {
      if (reloadAnimationTimeoutRef.current) {
        window.clearTimeout(reloadAnimationTimeoutRef.current)
      }
    }
  }, [])

  const handleReloadEyetrackers = () => {
    setIsReloadAnimating(true)
    void refetch()

    if (reloadAnimationTimeoutRef.current) {
      window.clearTimeout(reloadAnimationTimeoutRef.current)
    }

    reloadAnimationTimeoutRef.current = window.setTimeout(() => {
      setIsReloadAnimating(false)
      reloadAnimationTimeoutRef.current = null
    }, 650)
  }

  const handleRemoveLicense = () => {
    form.setValue("licenceFile", null, { shouldDirty: true, shouldValidate: true })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setDragActive(false)
    setSubmitError(null)
  }

  const submitSelection = React.useCallback(async () => {
    setSubmitError(null)
    const currentValues = form.getValues()

    if (!currentValues.serialNumber) {
      form.setError("serialNumber", { message: "Please select an eyetracker." })
      return false
    }

    if (!currentValues.licenceFile) {
      if (!hasSavedLicence || currentValues.overwriteExistingLicence) {
        form.setError("licenceFile", { message: "Please upload a license file." })
        return false
      }
    }

    const shouldSkipApiCall =
      hasSavedLicence &&
      !currentValues.overwriteExistingLicence &&
      !currentValues.licenceFile

    if (shouldSkipApiCall) {
      return true
    }

    try {
      await selectEyetracker({
        serialNumber: currentValues.serialNumber,
        saveLicence: currentValues.saveLicence,
        licenceFile: currentValues.licenceFile,
      }).unwrap()
      return true
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
      return false
    }
  }, [form, hasSavedLicence, selectEyetracker])

  React.useEffect(() => {
    onSubmitRequestChange?.(submitSelection)
    return () => onSubmitRequestChange?.(null)
  }, [onSubmitRequestChange, submitSelection])

  return (
    <Card>
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg">Eyetracker setup</CardTitle>
        <CardDescription>
          Choose your eyetracker and upload the associated license file.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <Form {...form}>
          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            <section className="space-y-3 rounded-lg border bg-card p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Select an eyetracker</h3>
                <p className="text-xs text-muted-foreground">
                  Pick the device model used in this experiment.
                </p>
              </div>

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel>Eyetracker</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleReloadEyetrackers}
                        disabled={isLoading}
                        className="h-7 px-2 text-xs"
                      >
                        <RefreshCw
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            (isLoading || isReloadAnimating) && "animate-spin"
                          )}
                        />
                        Reload
                      </Button>
                    </div>

                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          setSubmitError(null)
                          form.setValue("overwriteExistingLicence", false, {
                            shouldDirty: true,
                            shouldValidate: false,
                          })
                          form.setValue("licenceFile", null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          form.setValue("saveLicence", false, {
                            shouldDirty: true,
                            shouldValidate: false,
                          })
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ""
                          }
                          field.onChange(value)
                        }}
                      >
                        <SelectTrigger
                          id="eyetracker-select"
                          className="w-full"
                          disabled={isLoading || isError}
                        >
                          <SelectValue
                            placeholder={
                              isLoading ? "Loading eyetrackers..." : "Select an eyetracker"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {eyetrackerOptions.map((eyetracker) => (
                            <SelectItem
                              key={eyetracker.value || eyetracker.label}
                              value={eyetracker.value || eyetracker.label}
                              disabled={!eyetracker.isSelectable}
                            >
                              <span className="flex items-center gap-2">
                                <Crosshair className="h-4 w-4 text-muted-foreground" />
                                {eyetracker.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isError ? (
                <p className="text-xs text-destructive">
                  Could not load eyetrackers.{" "}
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="font-medium underline underline-offset-2"
                  >
                    Retry
                  </button>
                </p>
              ) : null}

              {!isLoading && !isError && eyetrackerOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No connected eyetrackers found.</p>
              ) : null}
              {!isLoading && eyetrackerOptions.some((item) => !item.isSelectable) ? (
                <p className="text-xs text-muted-foreground">
                  Some eyetrackers are unavailable because serial number is missing.
                </p>
              ) : null}
            </section>

            {selectedSerialNumber ? (
              <section className="space-y-3 rounded-lg border bg-card p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Upload license</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload a valid license file for {selectedEyetrackerLabel}.
                  </p>
                </div>

                {hasSavedLicence ? (
                  <Alert className="border-amber-400/60 bg-amber-50/60 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
                    <Info />
                    <AlertTitle>Existing license detected</AlertTitle>
                    <AlertDescription>
                      The system already has a saved license for this eyetracker. To prevent
                      accidental replacement, uploading is locked until you explicitly enable
                      overwrite.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {hasSavedLicence ? (
                  <div className="rounded-md border bg-muted/20 p-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="overwrite-existing-license"
                        checked={overwriteExistingLicence}
                        onCheckedChange={(checked) => {
                          const shouldOverwrite = Boolean(checked)
                          setSubmitError(null)
                          form.setValue("overwriteExistingLicence", shouldOverwrite, {
                            shouldDirty: true,
                            shouldValidate: false,
                          })
                          if (!shouldOverwrite) {
                            handleRemoveLicense()
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="overwrite-existing-license"
                          className="cursor-pointer text-destructive"
                        >
                          I want to overwrite the existing license
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Enable this only if you intentionally want to replace the saved license.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <FormField
                  control={form.control}
                  name="licenceFile"
                  render={() => (
                    <FormItem>
                      <FormLabel htmlFor="license-file">License file</FormLabel>
                      <FormControl>
                        <div
                          role="button"
                          tabIndex={licenceFile || !canUploadNewLicense ? -1 : 0}
                          aria-disabled={Boolean(licenceFile || !canUploadNewLicense)}
                          onClick={() => {
                            if (!licenceFile && canUploadNewLicense) {
                              fileInputRef.current?.click()
                            }
                          }}
                          onKeyDown={(event) => {
                            if (licenceFile || !canUploadNewLicense) {
                              return
                            }
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              fileInputRef.current?.click()
                            }
                          }}
                          onDragOver={(event) => {
                            if (licenceFile || !canUploadNewLicense) {
                              return
                            }
                            event.preventDefault()
                            setDragActive(true)
                          }}
                          onDragLeave={(event) => {
                            if (licenceFile || !canUploadNewLicense) {
                              return
                            }
                            event.preventDefault()
                            setDragActive(false)
                          }}
                          onDrop={(event) => {
                            if (licenceFile || !canUploadNewLicense) {
                              return
                            }
                            event.preventDefault()
                            setDragActive(false)
                            const nextFile = event.dataTransfer.files?.[0] ?? null
                            setSubmitError(null)
                            form.setValue("licenceFile", nextFile, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }}
                          className={cn(
                            "group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
                            dragActive
                              ? "border-primary bg-primary/5"
                              : "border-muted-foreground/35 hover:border-primary/70 hover:bg-muted/20",
                            licenceFile &&
                              "cursor-not-allowed opacity-70 hover:border-muted-foreground/35 hover:bg-transparent",
                            !canUploadNewLicense &&
                              "cursor-not-allowed border-amber-400/60 bg-amber-50/30 opacity-80 hover:border-amber-400/60 hover:bg-amber-50/30 dark:border-amber-700 dark:bg-amber-950/20"
                          )}
                        >
                          <Upload className="mb-3 h-7 w-7 text-muted-foreground transition-colors group-hover:text-primary" />
                          <p className="text-sm font-medium text-foreground">
                            {licenceFile
                              ? "License file uploaded"
                              : !canUploadNewLicense
                                ? "Upload is locked"
                                : "Drag and drop your license file"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {licenceFile
                              ? "Only one file is allowed. Remove it to upload another."
                              : !canUploadNewLicense
                                ? "Enable overwrite above to upload a replacement license."
                                : hasSavedLicence
                                  ? "Upload a new file to overwrite the saved license."
                                : "or click to browse"}
                          </p>
                          <input
                            id="license-file"
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            disabled={Boolean(licenceFile || !canUploadNewLicense)}
                            onChange={(event) => {
                              const nextFile = event.target.files?.[0] ?? null
                              setSubmitError(null)
                              form.setValue("licenceFile", nextFile, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {licenceFile ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileCheck2 className="h-4 w-4 shrink-0 text-primary" />
                      <Badge variant="secondary">Uploaded</Badge>
                      <span className="truncate font-medium">{licenceFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLicense}
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                ) : null}

                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="save-license-for-later"
                      checked={saveLicence}
                      onCheckedChange={(checked) => {
                        setSubmitError(null)
                        form.setValue("saveLicence", Boolean(checked), {
                          shouldDirty: true,
                          shouldValidate: false,
                        })
                      }}
                      disabled={!licenceFile}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="save-license-for-later" className="cursor-pointer">
                        Save this license for future use
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Next time you select this eyetracker, you will not need to upload the
                        license again.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </form>
        </Form>

        {submitError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not continue</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
