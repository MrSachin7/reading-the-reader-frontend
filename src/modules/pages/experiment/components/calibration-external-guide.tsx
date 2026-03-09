"use client"

import Image from "next/image"
import { Expand, MonitorUp, ScanEye, ShieldCheck, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type CalibrationExternalGuideProps = {
  isFullscreen: boolean
  isVisible: boolean
  externalCalibrationCompleted: boolean
  onRequestFullscreen: () => void
  onConfirmExternalCalibration: () => void
  onClose: () => void
}

export function CalibrationExternalGuide({
  isFullscreen,
  isVisible,
  externalCalibrationCompleted,
  onRequestFullscreen,
  onConfirmExternalCalibration,
  onClose,
}: CalibrationExternalGuideProps) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.18),rgba(2,6,23,0.98)_48%)] text-white">
      <header className="flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3">
          <Badge className="bg-white/10 text-white">Calibration Workspace</Badge>
          <Badge variant="outline" className="border-white/20 text-white/90">
            Step 1 of 3
          </Badge>
        </div>
        <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
          Exit
        </Button>
      </header>

      <div className="grid gap-10 px-6 pb-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10">
        <section className="flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Before calibration</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance lg:text-6xl">
            Finish the Tobii software calibration outside the browser.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 lg:text-lg">
            This browser workspace comes after the device has already been calibrated in Tobii
            software. Complete that first, then come back here for the full-screen five-point pass.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-full border border-cyan-300/40 bg-cyan-400/10 p-3">
                  <MonitorUp className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">1. Open Tobii software</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Create or select the participant profile and start calibration in the Tobii app.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-full border border-cyan-300/40 bg-cyan-400/10 p-3">
                  <ScanEye className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">2. Complete the Tobii pass</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Make sure the participant follows the Tobii targets and the profile looks
                    acceptable before returning here.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-full border border-cyan-300/40 bg-cyan-400/10 p-3">
                  <ShieldCheck className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">3. Return to this workspace</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Once that is done, confirm it below. The browser will then guide the
                    participant with one instruction at a time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-sm font-medium text-white">Tobii help image</p>
              <p className="mt-1 text-xs text-slate-400">
                The highlighted profile area is where the operator typically starts or chooses the
                participant calibration profile.
              </p>
            </div>
            <Image
              src="/calibration-step.png"
              alt="Tobii software calibration help screenshot"
              width={820}
              height={758}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-slate-950/55 px-6 py-5 backdrop-blur lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge
              variant="outline"
              className={isFullscreen ? "border-emerald-400/40 text-emerald-200" : "border-amber-400/40 text-amber-200"}
            >
              {isFullscreen ? "Full screen ready" : "Full screen required"}
            </Badge>
            <Badge
              variant="outline"
              className={isVisible ? "border-emerald-400/40 text-emerald-200" : "border-rose-400/40 text-rose-200"}
            >
              {isVisible ? "Tab visible" : "Tab must stay visible"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isFullscreen ? (
              <Button
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={onRequestFullscreen}
              >
                <Expand className="h-4 w-4" />
                Enter full screen
              </Button>
            ) : null}
            <Button onClick={onConfirmExternalCalibration}>
              {externalCalibrationCompleted ? "Continue to readiness" : "I completed calibration in Tobii"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
