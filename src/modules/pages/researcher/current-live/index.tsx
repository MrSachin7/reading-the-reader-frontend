"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { Activity, Gauge, Sparkles, Type, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type FontTheme, FONTS } from "@/hooks/use-font-theme"
import { applyInterventionCommand, subscribeToGaze } from "@/lib/gaze-socket"
import { useLiveExperimentSession } from "@/lib/use-live-experiment-session"
import { calculateGazePoint } from "@/modules/pages/gaze/lib/gaze-helpers"
import { useLiveGazeStream } from "@/modules/pages/gaze/lib/use-live-gaze-stream"
import { ReaderShell } from "@/modules/pages/reading/components/ReaderShell"
import { parseMinimalMarkdown } from "@/modules/pages/reading/lib/minimalMarkdown"
import { calculateLix } from "@/modules/pages/reading/lib/readingMetrics"
import {
  DEFAULT_READING_PRESENTATION,
  normalizeFontTheme,
  normalizeReadingPresentation,
} from "@/modules/pages/reading/lib/readingPresentation"
import { tokenizeDocument } from "@/modules/pages/reading/lib/tokenize"

const FONT_LABELS: Record<FontTheme, string> = {
  geist: "Geist",
  inter: "Inter",
  "space-grotesk": "Space Grotesk",
  merriweather: "Merriweather",
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-"
  }

  return value.toFixed(digits).replace(/\.0$/, "")
}

function formatTime(unixMs: number | null | undefined) {
  if (!unixMs) {
    return "-"
  }

  return new Date(unixMs).toLocaleTimeString()
}

function getLatencyTone(latencyMs: number | null | undefined) {
  if (latencyMs === null || latencyMs === undefined || Number.isNaN(latencyMs)) {
    return "text-muted-foreground"
  }

  if (latencyMs <= 60) {
    return "text-emerald-500"
  }

  if (latencyMs <= 120) {
    return "text-amber-500"
  }

  return "text-rose-500"
}

function getLatencyBars(latencyMs: number | null | undefined) {
  if (latencyMs === null || latencyMs === undefined || Number.isNaN(latencyMs)) {
    return 0
  }

  if (latencyMs <= 60) {
    return 4
  }

  if (latencyMs <= 120) {
    return 3
  }

  if (latencyMs <= 180) {
    return 2
  }

  return 1
}

function LatencySignal({ latencyMs }: { latencyMs: number | null | undefined }) {
  const bars = getLatencyBars(latencyMs)
  const tone = getLatencyTone(latencyMs)

  return (
    <div className={`flex items-end gap-0.5 ${tone}`} aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className={`w-1 rounded-full bg-current transition-opacity ${
            index < bars ? "opacity-100" : "opacity-20"
          }`}
          style={{ height: `${6 + index * 3}px` }}
        />
      ))}
    </div>
  )
}

function MirrorStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  accent?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-background/82 px-3 py-2.5 shadow-sm backdrop-blur-md">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
      {accent ? <div className="shrink-0">{accent}</div> : null}
    </div>
  )
}

export default function ResearcherCurrentLivePage() {
  const session = useLiveExperimentSession()
  const liveGaze = useLiveGazeStream()
  const [validityRate, setValidityRate] = useState(0)

  useEffect(() => {
    let totalSamples = 0
    let validSamples = 0

    const unsubscribe = subscribeToGaze((sample) => {
      totalSamples += 1
      if (calculateGazePoint(sample)) {
        validSamples += 1
      }
    })

    const timer = window.setInterval(() => {
      setValidityRate(totalSamples === 0 ? 0 : validSamples / totalSamples)
      totalSamples = 0
      validSamples = 0
    }, 1000)

    return () => {
      unsubscribe()
      window.clearInterval(timer)
    }
  }, [])

  if (!session) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Researcher live view</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connecting to the current experiment session.
          </p>
        </header>
      </section>
    )
  }

  if (!session.isActive) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Researcher live view</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            No experiment is running. Start the participant reading session from the setup flow to enable the mirrored researcher view.
          </p>
        </header>

        <Card className="rounded-[1.75rem] border-dashed">
          <CardHeader>
            <CardTitle>No ongoing experiment</CardTitle>
            <CardDescription>
              This page becomes active once the participant session is started and the reading material has been pushed to the backend session state.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    )
  }

  if (!session.readingSession?.content) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Researcher live view</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            The experiment is active, but no reading material has been registered in the live session yet.
          </p>
        </header>

        <Card className="rounded-[1.75rem] border-dashed">
          <CardHeader>
            <CardTitle>Waiting for reading material</CardTitle>
            <CardDescription>
              Return to the experiment setup flow and start the participant reading session again if this state persists.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    )
  }

  return (
    <ResearcherCurrentLiveBody
      session={session}
      liveGaze={liveGaze}
      validityRate={validityRate}
    />
  )
}

type ResearcherCurrentLiveBodyProps = {
  session: NonNullable<ReturnType<typeof useLiveExperimentSession>>
  liveGaze: ReturnType<typeof useLiveGazeStream>
  validityRate: number
}

function ResearcherCurrentLiveBody({
  session,
  liveGaze,
  validityRate,
}: ResearcherCurrentLiveBodyProps) {
  const readingSession = session.readingSession!
  const content = readingSession.content!
  const [followParticipant, setFollowParticipant] = useState(true)

  const presentation = normalizeReadingPresentation({
    fontFamily: readingSession.presentation.fontFamily,
    fontSizePx: readingSession.presentation.fontSizePx,
    lineWidthPx: readingSession.presentation.lineWidthPx,
    lineHeight: readingSession.presentation.lineHeight,
    letterSpacingEm: readingSession.presentation.letterSpacingEm,
    editableByExperimenter: readingSession.presentation.editableByResearcher,
  })

  const parsedDoc = useMemo(() => parseMinimalMarkdown(content.markdown), [content.markdown])
  const tokenizedBlocks = useMemo(
    () => tokenizeDocument(parsedDoc, content.documentId),
    [content.documentId, parsedDoc]
  )
  const tokenTextLookup = useMemo(() => {
    const entries = new Map<string, string>()
    for (const block of tokenizedBlocks) {
      if ("runs" in block) {
        for (const run of block.runs) {
          for (const token of run.tokens) {
            if (token.kind === "word") {
              entries.set(token.id, token.text)
            }
          }
        }
      }

      if ("items" in block) {
        for (const item of block.items) {
          for (const run of item.runs) {
            for (const token of run.tokens) {
              if (token.kind === "word") {
                entries.set(token.id, token.text)
              }
            }
          }
        }
      }
    }

    return entries
  }, [tokenizedBlocks])

  const activeWord = readingSession.focus.activeTokenId
    ? tokenTextLookup.get(readingSession.focus.activeTokenId) ?? readingSession.focus.activeTokenId
    : null
  const activeBlock = tokenizedBlocks.find((block) => block.blockId === readingSession.focus.activeBlockId)
  const activeBlockLix =
    activeBlock && "lixScore" in activeBlock && typeof activeBlock.lixScore === "number"
      ? activeBlock.lixScore
      : null
  const documentLix = calculateLix(content.markdown)
  const latencyMs = liveGaze.connectionStats?.lastRttMs ?? null

  const commitIntervention = useCallback(
    (next: Partial<typeof DEFAULT_READING_PRESENTATION>, reason: string) => {
      applyInterventionCommand({
        source: "manual",
        trigger: "researcher-ui",
        reason,
        presentation: {
          fontFamily: next.fontFamily ?? null,
          fontSizePx: next.fontSizePx ?? null,
          lineWidthPx: next.lineWidthPx ?? null,
          lineHeight: next.lineHeight ?? null,
          letterSpacingEm: next.letterSpacingEm ?? null,
          editableByResearcher: next.editableByExperimenter ?? null,
        },
      })
    },
    []
  )

  return (
    <section className="flex h-[calc(100vh-7rem)] min-h-[720px] flex-col gap-4 overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Researcher live view</h1>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
            Mirror-first researcher console with backend-driven interventions and content-normalized gaze mapping.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Session live</Badge>
          <Badge variant={readingSession.participantViewport.isConnected ? "default" : "outline"}>
            {readingSession.participantViewport.isConnected ? "Participant connected" : "Participant disconnected"}
          </Badge>
        </div>
      </header>

      <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_23rem]">
        <Card className="flex h-full min-h-0 flex-col rounded-[1.75rem]">
          <CardHeader className="shrink-0 space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-4 w-4" />
              Live stats
            </CardTitle>
            <CardDescription>
              Session telemetry and mirror controls, kept outside the reading area.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="grid gap-2">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <label htmlFor="follow-participant" className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    id="follow-participant"
                    checked={followParticipant}
                    onCheckedChange={(checked) => setFollowParticipant(checked === true)}
                  />
                  <div>
                    <p className="text-sm font-medium">Follow participant</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Sync the reader to the participant&apos;s scroll position.
                    </p>
                  </div>
                </label>
              </div>
              <div className="rounded-2xl border bg-muted/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current word</p>
                <p className="mt-1 truncate text-sm font-semibold">{activeWord ?? "No fixation"}</p>
              </div>
              <MirrorStat
                icon={<Gauge className="h-4 w-4" />}
                label="Sample rate"
                value={`${liveGaze.sampleRateHz} Hz`}
              />
              <MirrorStat
                icon={<Activity className="h-4 w-4" />}
                label="Validity"
                value={formatPercent(validityRate)}
              />
              <MirrorStat
                icon={<Activity className="h-4 w-4" />}
                label="Latency"
                value={latencyMs === null ? "-" : `${latencyMs} ms`}
                accent={<LatencySignal latencyMs={latencyMs} />}
              />
              <MirrorStat
                icon={<UserRound className="h-4 w-4" />}
                label="Participant"
                value={session.participant?.name ?? "Not registered"}
              />
            </div>
          </CardContent>
        </Card>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border bg-card shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
          <div className="h-full min-h-0">
            <ReaderShell
              docId={content.documentId}
              markdown={content.markdown}
              presentation={presentation}
              experimentSetupName={content.title}
              preserveContextOnIntervention={true}
              highlightContext={true}
              displayGazePosition={false}
              highlightTokensBeingLookedAt={false}
              showToolbar={false}
              showBackButton={false}
              showLixScores={true}
              viewportScrollProgress={
                followParticipant ? readingSession.participantViewport.scrollProgress : null
              }
              remoteFocus={{
                isInsideReadingArea: readingSession.focus.isInsideReadingArea,
                normalizedContentX: readingSession.focus.normalizedContentX,
                normalizedContentY: readingSession.focus.normalizedContentY,
                activeTokenId: readingSession.focus.activeTokenId,
              }}
              embedded
              frameClassName="rounded-none border-0 shadow-none"
            />
          </div>
        </div>

        <Card className="flex h-full min-h-0 flex-col rounded-[1.75rem]">
          <CardHeader className="shrink-0 space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Type className="h-4 w-4" />
              Intervention console
            </CardTitle>
            <CardDescription>
              Adjust the participant presentation without leaving the live mirror.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <Tabs defaultValue="controls" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="grid w-full shrink-0 grid-cols-2">
                <TabsTrigger value="controls">Controls</TabsTrigger>
                <TabsTrigger value="context">Context</TabsTrigger>
              </TabsList>

              <TabsContent value="controls" className="mt-4 flex-1">
                <div className="grid gap-4">
                  <Field>
                    <FieldLabel>Font family</FieldLabel>
                    <Select
                      value={normalizeFontTheme(presentation.fontFamily)}
                      onValueChange={(value) =>
                        commitIntervention(
                          { fontFamily: value as FontTheme },
                          `Changed font family to ${FONT_LABELS[value as FontTheme]}`
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose font" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONTS.map((font) => (
                          <SelectItem key={font} value={font}>
                            {FONT_LABELS[font]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Lock participant editing</p>
                      <p className="text-xs text-muted-foreground">
                        Prevent participant-side presentation changes.
                      </p>
                    </div>
                    <Switch
                      checked={!presentation.editableByExperimenter}
                      onCheckedChange={(checked) =>
                        commitIntervention(
                          { editableByExperimenter: !checked },
                          checked
                            ? "Locked participant-side presentation changes"
                            : "Unlocked participant-side presentation changes"
                        )
                      }
                    />
                  </div>

                  <Field>
                    <div className="mb-2 flex items-center justify-between">
                      <FieldLabel>Font size</FieldLabel>
                      <span className="text-xs text-muted-foreground">{presentation.fontSizePx}px</span>
                    </div>
                    <Slider
                      min={14}
                      max={28}
                      step={2}
                      value={[presentation.fontSizePx]}
                      onValueChange={(value) =>
                        commitIntervention(
                          { fontSizePx: value[0] ?? presentation.fontSizePx },
                          "Adjusted font size"
                        )
                      }
                    />
                  </Field>

                  <Field>
                    <div className="mb-2 flex items-center justify-between">
                      <FieldLabel>Line width</FieldLabel>
                      <span className="text-xs text-muted-foreground">{presentation.lineWidthPx}px</span>
                    </div>
                    <Slider
                      min={520}
                      max={920}
                      step={20}
                      value={[presentation.lineWidthPx]}
                      onValueChange={(value) =>
                        commitIntervention(
                          { lineWidthPx: value[0] ?? presentation.lineWidthPx },
                          "Adjusted line width"
                        )
                      }
                    />
                  </Field>

                  <Field>
                    <div className="mb-2 flex items-center justify-between">
                      <FieldLabel>Line height</FieldLabel>
                      <span className="text-xs text-muted-foreground">
                        {presentation.lineHeight.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      min={1.2}
                      max={2.2}
                      step={0.05}
                      value={[presentation.lineHeight]}
                      onValueChange={(value) =>
                        commitIntervention(
                          { lineHeight: value[0] ?? presentation.lineHeight },
                          "Adjusted line height"
                        )
                      }
                    />
                  </Field>

                  <Field>
                    <div className="mb-2 flex items-center justify-between">
                      <FieldLabel>Letter spacing</FieldLabel>
                      <span className="text-xs text-muted-foreground">
                        {presentation.letterSpacingEm.toFixed(2)}em
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={0.12}
                      step={0.01}
                      value={[presentation.letterSpacingEm]}
                      onValueChange={(value) =>
                        commitIntervention(
                          { letterSpacingEm: value[0] ?? presentation.letterSpacingEm },
                          "Adjusted letter spacing"
                        )
                      }
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="context" className="mt-4 flex-1">
                <div className="flex h-full min-h-0 flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserRound className="h-4 w-4" />
                    {session.participant?.name ?? "Participant not registered"}
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Normalized gaze
                      </p>
                      <p className="mt-1 font-semibold">
                        {readingSession.focus.isInsideReadingArea
                          ? `${formatNumber(readingSession.focus.normalizedContentX, 3)}, ${formatNumber(readingSession.focus.normalizedContentY, 3)}`
                          : "Outside area"}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Document LIX
                        </p>
                        <p className="mt-1 font-semibold">{formatNumber(documentLix, 1)}</p>
                      </div>
                      <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Focused block LIX
                        </p>
                        <p className="mt-1 font-semibold">{formatNumber(activeBlockLix, 1)}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Viewport
                        </p>
                        <p className="mt-1 font-semibold">
                          {Math.round(readingSession.participantViewport.viewportWidthPx)} x{" "}
                          {Math.round(readingSession.participantViewport.viewportHeightPx)}
                        </p>
                      </div>
                      <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Mirror mode
                        </p>
                        <p className="mt-1 font-semibold">
                          {followParticipant ? "Following participant" : "Free researcher scroll"}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        Latest intervention
                      </div>
                      <p className="mt-2 font-medium">
                        {readingSession.latestIntervention?.reason ?? "No interventions issued yet."}
                      </p>
                      {readingSession.latestIntervention ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {readingSession.latestIntervention.appliedPresentation.fontFamily},{" "}
                          {readingSession.latestIntervention.appliedPresentation.fontSizePx}px,{" "}
                          {readingSession.latestIntervention.appliedPresentation.lineWidthPx}px |{" "}
                          {formatTime(readingSession.latestIntervention.appliedAtUnixMs)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-h-0 rounded-2xl border bg-muted/20">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Applied interventions
                      </p>
                      <Badge variant="outline">{readingSession.recentInterventions.length}</Badge>
                    </div>

                    {readingSession.recentInterventions.length > 0 ? (
                      <ScrollArea className="h-72">
                        <div className="divide-y">
                          {readingSession.recentInterventions.map((event) => (
                            <div key={event.id} className="px-4 py-3 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <Badge variant="outline">{event.source}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(event.appliedAtUnixMs)}
                                </span>
                              </div>
                              <p className="mt-2 font-medium leading-5">{event.reason}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {event.appliedPresentation.fontFamily},{" "}
                                {event.appliedPresentation.fontSizePx}px,{" "}
                                {event.appliedPresentation.lineWidthPx}px
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="px-4 pb-4 text-sm text-muted-foreground">
                        No interventions have been issued in this session yet.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
