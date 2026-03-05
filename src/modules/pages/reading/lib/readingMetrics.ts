export function countWords(md: string): number {
  const normalized = md
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^-\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "");

  const words = normalized.match(/\S+/g);
  return words ? words.length : 0;
}

export function estimateMinutes(words: number, wpm = 200): number {
  if (wpm <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(words / wpm));
}

export function formatEstimatedMinutes(words: number, wpm = 200): string {
  return `~${estimateMinutes(words, wpm)} min`;
}
