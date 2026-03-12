"use client"

import { useCallback, useEffect } from "react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  registerParticipantView,
  unregisterParticipantView,
  updateParticipantViewport,
  updateReadingFocus,
} from "@/lib/gaze-socket"
import { useLiveExperimentSession } from "@/lib/use-live-experiment-session"
import { ReaderShell, type ReaderViewportMetrics } from "@/modules/pages/reading/components/ReaderShell"
import { MOCK_READING_MD } from "@/modules/pages/reading/content/mockReading"
import { normalizeReadingPresentation } from "@/modules/pages/reading/lib/readingPresentation"
import type { GazeFocusState } from "@/modules/pages/reading/lib/useGazeTokenHighlight"
import { useAppSelector } from "@/redux"

const MOCK_DOC_ID = "mock-reading-v1"

export function ReadingPage() {
  const liveSession = useLiveExperimentSession()
  const draftReadingSession = useAppSelector((state) => state.experiment.readingSession)

  useEffect(() => {
    registerParticipantView()

    return () => {
      unregisterParticipantView()
    }
  }, [])

  const handleViewportMetricsChange = useCallback((metrics: ReaderViewportMetrics) => {
    updateParticipantViewport(metrics)
  }, [])

  const handleFocusChange = useCallback((focus: GazeFocusState) => {
    updateReadingFocus({
      isInsideReadingArea: focus.isInsideReadingArea,
      normalizedContentX: focus.normalizedContentX,
      normalizedContentY: focus.normalizedContentY,
      activeTokenId: focus.activeTokenId,
      activeBlockId: focus.activeBlockId,
    })
  }, [])

  const liveReadingSession = liveSession?.readingSession
  const markdown =
    liveReadingSession?.content?.markdown ??
    (draftReadingSession.source === "custom" && draftReadingSession.customMarkdown.trim().length > 0
      ? draftReadingSession.customMarkdown
      : MOCK_READING_MD)
  const docId = liveReadingSession?.content?.documentId ?? MOCK_DOC_ID
  const title =
    liveReadingSession?.content?.title ??
    (draftReadingSession.title.trim().length > 0
      ? draftReadingSession.title.trim()
      : "Reading as Deliberate Attention")
  const presentation = normalizeReadingPresentation({
    fontFamily: liveReadingSession?.presentation.fontFamily,
    fontSizePx: liveReadingSession?.presentation.fontSizePx,
    lineWidthPx: liveReadingSession?.presentation.lineWidthPx,
    lineHeight: liveReadingSession?.presentation.lineHeight,
    letterSpacingEm: liveReadingSession?.presentation.letterSpacingEm,
    editableByExperimenter: liveReadingSession?.presentation.editableByResearcher,
  })

  if (!liveSession?.isActive) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 md:px-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>No active experiment</CardTitle>
              <CardDescription>
                Start the reading session from the experiment setup flow before opening the participant view.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <ReaderShell
      docId={docId}
      markdown={markdown}
      presentation={presentation}
      experimentSetupName={title}
      preserveContextOnIntervention={true}
      highlightContext={true}
      displayGazePosition={true}
      highlightTokensBeingLookedAt={true}
      showToolbar={false}
      showBackButton={false}
      showLixScores={false}
      onViewportMetricsChange={handleViewportMetricsChange}
      onFocusChange={handleFocusChange}
    />
  )
}
