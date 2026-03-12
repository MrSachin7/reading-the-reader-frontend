"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  Eye,
  LayoutTemplate,
  Sparkles,
  Type,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { applyInterventionCommand, subscribeToGaze } from "@/lib/gaze-socket"
import { useLiveExperimentSession } from "@/lib/use-live-experiment-session"
import { type FontTheme, FONTS } from "@/hooks/use-font-theme"
import { ReaderShell } from "@/modules/pages/reading/components/ReaderShell"
import { calculateLix } from "@/modules/pages/reading/lib/readingMetrics"
import {
  DEFAULT_READING_PRESENTATION,
  normalizeFontTheme,
  normalizeReadingPresentation,
} from "@/modules/pages/reading/lib/readingPresentation"
import { parseMinimalMarkdown } from "@/modules/pages/reading/lib/minimalMarkdown"
import { tokenizeDocument } from "@/modules/pages/reading/lib/tokenize"
import { calculateGazePoint } from "@/modules/pages/gaze/lib/gaze-helpers"
import { useLiveGazeStream } from "@/modules/pages/gaze/lib/use-live-gaze-stream"

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
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Researcher live view</h1>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
            Mirrors the participant reader using backend-owned presentation state, participant scroll progress, and content-normalized gaze coordinates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Session live</Badge>
          <Badge variant={readingSession.participantViewport.isConnected ? "default" : "outline"}>
            {readingSession.participantViewport.isConnected ? "Participant connected" : "Participant disconnected"}
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4" />
                Live telemetry
              </CardTitle>
              <CardDescription>
                Current session health and content-space gaze state.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sample rate</p>
                <p className="mt-2 text-2xl font-semibold">{liveGaze.sampleRateHz} Hz</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Validity</p>
                <p className="mt-2 text-2xl font-semibold">{formatPercent(validityRate)}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latency</p>
                <p className="mt-2 text-2xl font-semibold">
                  {liveGaze.connectionStats?.lastRttMs ?? "-"} ms
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Clients</p>
                <p className="mt-2 text-2xl font-semibold">{session.connectedClients}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-4 w-4" />
                Reader focus
              </CardTitle>
              <CardDescription>
                Derived from participant gaze inside the reading area only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current word</p>
                  <p className="mt-2 text-base font-semibold">{activeWord ?? "No active fixation"}</p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Normalized gaze</p>
                  <p className="mt-2 text-base font-semibold">
                    {readingSession.focus.isInsideReadingArea
                      ? `${formatNumber(readingSession.focus.normalizedContentX, 3)}, ${formatNumber(readingSession.focus.normalizedContentY, 3)}`
                      : "Outside reading area"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Document LIX</p>
                  <p className="mt-2 text-base font-semibold">{formatNumber(documentLix, 1)}</p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Focused block LIX</p>
                  <p className="mt-2 text-base font-semibold">{formatNumber(activeBlockLix, 1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="h-4 w-4" />
                Interventions
              </CardTitle>
              <CardDescription>
                Manual presentation commands are sent to the backend so they can later be invoked by AI or rule-based strategies through the same runtime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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
                  <span className="text-xs text-muted-foreground">{presentation.lineHeight.toFixed(2)}</span>
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

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-medium">Lock participant-side editing</p>
                  <p className="text-xs text-muted-foreground">
                    Disable participant-side presentation changes for this session.
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
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4" />
                Intervention log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {readingSession.recentInterventions.slice(0, 5).map((event) => (
                <div key={event.id} className="rounded-2xl border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{event.source}</Badge>
                    <span className="text-xs text-muted-foreground">{formatTime(event.appliedAtUnixMs)}</span>
                  </div>
                  <p className="mt-3 font-medium">{event.reason}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {event.appliedPresentation.fontFamily}, {event.appliedPresentation.fontSizePx}px, {event.appliedPresentation.lineWidthPx}px
                  </p>
                </div>
              ))}
              {readingSession.recentInterventions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No interventions have been issued in this session yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-4">
          <Card className="rounded-[1.5rem]">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LayoutTemplate className="h-4 w-4" />
                  Participant mirror
                </CardTitle>
                <CardDescription>
                  {content.title}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4" />
                {session.participant?.name ?? "Participant not registered"}
              </div>
            </CardHeader>
          </Card>

          <div className="h-[calc(100vh-16rem)] min-h-[540px]">
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
              viewportScrollProgress={readingSession.participantViewport.scrollProgress}
              remoteFocus={{
                isInsideReadingArea: readingSession.focus.isInsideReadingArea,
                normalizedContentX: readingSession.focus.normalizedContentX,
                normalizedContentY: readingSession.focus.normalizedContentY,
                activeTokenId: readingSession.focus.activeTokenId,
              }}
              embedded
            />
          </div>
        </div>
      </div>
    </section>
  )
}
