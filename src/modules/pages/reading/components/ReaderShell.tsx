"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MarkdownReader } from "@/modules/pages/reading/components/MarkdownReader";
import { LiveGazeOverlay } from "@/modules/pages/gaze/components/LiveGazeOverlay";
import { ReadingToolbar } from "@/modules/pages/reading/components/ReadingToolbar";
import { countWords, formatEstimatedMinutes } from "@/modules/pages/reading/lib/readingMetrics";
import { parseMinimalMarkdown } from "@/modules/pages/reading/lib/minimalMarkdown";
import { tokenizeDocument } from "@/modules/pages/reading/lib/tokenize";
import { useGazeTokenHighlight } from "@/modules/pages/reading/lib/useGazeTokenHighlight";
import { useReadingProgress } from "@/modules/pages/reading/lib/useReadingProgress";
import { useReadingSettings } from "@/modules/pages/reading/lib/useReadingSettings";

type ReaderShellProps = {
  docId: string;
  markdown: string;
};

const FONT_FAMILY_STYLES = {
  geist: "var(--font-geist-sans)",
  inter: "var(--font-inter)",
  "space-grotesk": "var(--font-space-grotesk)",
  merriweather: "var(--font-merriweather)",
} as const;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}

export function ReaderShell({ docId, markdown }: ReaderShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const escHoldTimerRef = useRef<number | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const {
    fontFamily,
    fontSizePx,
    lineWidthPx,
    lineHeight,
    letterSpacingEm,
    experimentSetupName,
    increaseFontSize,
    decreaseFontSize,
    increaseLineWidth,
    decreaseLineWidth,
    resetReadingSettings,
  } = useReadingSettings();

  const { resetToTop } = useReadingProgress({ containerRef, docId });
  useGazeTokenHighlight({ containerRef });

  const parsedDoc = useMemo(() => parseMinimalMarkdown(markdown), [markdown]);
  const tokenizedBlocks = useMemo(() => tokenizeDocument(parsedDoc, docId), [docId, parsedDoc]);

  const words = useMemo(() => countWords(markdown), [markdown]);
  const estimatedTimeLabel = useMemo(() => formatEstimatedMinutes(words), [words]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isFocusMode && event.key === "Escape") {
        if (escHoldTimerRef.current !== null) {
          return;
        }

        escHoldTimerRef.current = window.setTimeout(() => {
          setIsFocusMode(false);
          escHoldTimerRef.current = null;
        }, 550);
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        increaseFontSize();
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        decreaseFontSize();
        return;
      }

      if (event.key === "[") {
        event.preventDefault();
        decreaseLineWidth();
        return;
      }

      if (event.key === "]") {
        event.preventDefault();
        increaseLineWidth();
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetToTop();
      }
    },
    [decreaseFontSize, decreaseLineWidth, increaseFontSize, increaseLineWidth, isFocusMode, resetToTop]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (escHoldTimerRef.current !== null) {
        window.clearTimeout(escHoldTimerRef.current);
        escHoldTimerRef.current = null;
      }
    };

    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      if (escHoldTimerRef.current !== null) {
        window.clearTimeout(escHoldTimerRef.current);
        escHoldTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className={isFocusMode ? "min-h-screen bg-background" : "min-h-screen bg-background px-4 py-5 md:px-8 md:py-8"}>
      <LiveGazeOverlay
        statusVariant="compact"
        hideMarkerWhenNoPoint
        markerClassName="h-4 w-4 border-blue-400 bg-blue-500/60 shadow-[0_0_22px_rgba(96,165,250,0.68)]"
      />

      <section
        className={
          isFocusMode
            ? "mx-auto flex h-screen w-full max-w-6xl flex-col overflow-hidden bg-background"
            : "mx-auto flex h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-card shadow-sm md:h-[calc(100vh-4rem)]"
        }
      >
        {!isFocusMode ? (
          <ReadingToolbar
            estimatedTimeLabel={estimatedTimeLabel}
            experimentSetupName={experimentSetupName}
            fontSizePx={fontSizePx}
            lineWidthPx={lineWidthPx}
            onIncreaseFont={increaseFontSize}
            onDecreaseFont={decreaseFontSize}
            onIncreaseWidth={increaseLineWidth}
            onDecreaseWidth={decreaseLineWidth}
            onReset={() => {
              resetReadingSettings();
              resetToTop();
            }}
            onEnterFocus={() => setIsFocusMode(true)}
          />
        ) : null}

        <div
          ref={containerRef}
          className={
            isFocusMode
              ? "flex-1 overflow-y-auto px-5 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-10 md:py-10"
              : "flex-1 overflow-y-auto px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-8 md:py-8"
          }
          style={{ msOverflowStyle: "none" }}
        >
          <div
            className="mx-auto w-full"
            style={{
              maxWidth: `${lineWidthPx}px`,
              fontSize: `${fontSizePx}px`,
              lineHeight,
              letterSpacing: `${letterSpacingEm}em`,
              fontFamily: FONT_FAMILY_STYLES[fontFamily],
            }}
          >
            <MarkdownReader blocks={tokenizedBlocks} />
          </div>
        </div>
      </section>
    </div>
  );
}
