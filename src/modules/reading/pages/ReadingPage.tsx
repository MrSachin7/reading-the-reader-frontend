import { ReaderShell } from "@/modules/reading/components/ReaderShell";
import { MOCK_READING_MD } from "@/modules/reading/content/mockReading";

const MOCK_DOC_ID = "mock-reading-v1";

export function ReadingPage() {
  return <ReaderShell docId={MOCK_DOC_ID} markdown={MOCK_READING_MD} />;
}
