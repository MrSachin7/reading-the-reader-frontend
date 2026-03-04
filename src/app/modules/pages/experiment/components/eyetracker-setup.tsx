"use client"

import * as React from "react"
import { Crosshair, FileCheck2, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetEyetrackersQuery } from "@/redux"

export function EyetrackerSetup() {
  const { data: eyetrackers = [], isLoading, isError, refetch } = useGetEyetrackersQuery()
  const [selectedEyetracker, setSelectedEyetracker] = React.useState("")
  const [licenseFile, setLicenseFile] = React.useState<File | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const eyetrackerOptions = React.useMemo(
    () =>
      eyetrackers.map((eyetracker) => {
        const value =
          eyetracker.serialNumber || `${eyetracker.name}-${eyetracker.model}`
        const label = `${eyetracker.name} / ${eyetracker.model} / ${eyetracker.serialNumber}`
        return { value, label }
      }),
    [eyetrackers]
  )

  const selectedEyetrackerLabel = eyetrackerOptions.find(
    (item) => item.value === selectedEyetracker
  )?.label

  return (
    <Card>
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg">Eyetracker setup</CardTitle>
        <CardDescription>
          Choose your eyetracker and upload the associated license file.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Select an eyetracker</h3>
            <p className="text-xs text-muted-foreground">
              Pick the device model used in this experiment.
            </p>
          </div>

          <Label htmlFor="eyetracker-select">Eyetracker</Label>
          <Select value={selectedEyetracker} onValueChange={setSelectedEyetracker}>
            <SelectTrigger id="eyetracker-select" className="w-full" disabled={isLoading || isError}>
              <SelectValue
                placeholder={
                  isLoading ? "Loading eyetrackers..." : "Select an eyetracker"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {eyetrackerOptions.map((eyetracker) => (
                <SelectItem key={eyetracker.value} value={eyetracker.value}>
                  <span className="flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-muted-foreground" />
                    {eyetracker.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
        </section>

        {selectedEyetracker ? (
          <section className="space-y-3 rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Upload license</h3>
              <p className="text-xs text-muted-foreground">
                Upload a valid license file for {selectedEyetrackerLabel}.
              </p>
            </div>

            <Label htmlFor="license-file">License file</Label>
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
                "group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/35 hover:border-primary/70 hover:bg-muted/20"
              )}
            >
              <Upload className="mb-3 h-7 w-7 text-muted-foreground transition-colors group-hover:text-primary" />
              <p className="text-sm font-medium text-foreground">Drag and drop your license file</p>
              <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
              <input
                id="license-file"
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)}
              />
            </div>

            {licenseFile ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <FileCheck2 className="h-4 w-4 text-primary" />
                <Badge variant="secondary">Uploaded</Badge>
                <span className="font-medium">{licenseFile.name}</span>
              </div>
            ) : null}
          </section>
        ) : null}
      </CardContent>
    </Card>
  )
}
