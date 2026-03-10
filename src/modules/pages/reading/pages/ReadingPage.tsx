import { ReaderShell } from "@/modules/pages/reading/components/ReaderShell";
import { MOCK_READING_MD } from "@/modules/pages/reading/content/mockReading";

const MOCK_DOC_ID = "mock-reading-v1";

export function ReadingPage() {
  return (
    <ReaderShell
      docId={MOCK_DOC_ID}
      markdown={MOCK_READING_MD}
      preserveContextOnIntervention = {true}
      highlightContext = {true}
      displayGazePosition = {false}
      highlightTokensBeingLookedAt = {true}
    />
  );
}
