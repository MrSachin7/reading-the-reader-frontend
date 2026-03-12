"use client"

import { ReaderShell } from "@/modules/pages/reading/components/ReaderShell"
import { MOCK_READING_MD } from "@/modules/pages/reading/content/mockReading"
import { useAppSelector } from "@/redux"

const MOCK_DOC_ID = "mock-reading-v1"

export function ReadingPage() {
  const readingSession = useAppSelector((state) => state.experiment.readingSession)
  const markdown =
    readingSession.source === "custom" && readingSession.customMarkdown.trim().length > 0
      ? readingSession.customMarkdown
      : MOCK_READING_MD
  const docId =
    readingSession.source === "custom" && readingSession.title.trim().length > 0
      ? `reading-material-${readingSession.title.trim().toLowerCase().replace(/\s+/g, "-")}`
      : MOCK_DOC_ID

  return (
    <ReaderShell
      docId={docId}
      markdown={markdown}
      preserveContextOnIntervention={true}
      highlightContext={true}
      displayGazePosition={true}
      highlightTokensBeingLookedAt={true}
    />
  )
}
