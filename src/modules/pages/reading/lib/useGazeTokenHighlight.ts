"use client";

import { type RefObject, useEffect, useRef } from "react";

import { subscribeToGaze } from "@/lib/gaze-socket";
import { useAppSelector } from "@/redux";
import {
  applyGazeOffset,
  calculateGazePoint,
  normalizeGazePoint,
  type GazePoint,
} from "@/modules/pages/gaze/lib/gaze-helpers";

type UseGazeTokenHighlightParams = {
  containerRef: RefObject<HTMLElement | null>;
  highlightTokensBeingLookedAt?: boolean;
};

type WordLayout = {
  bottom: number;
  centerX: number;
  centerY: number;
  element: HTMLElement;
  height: number;
  index: number;
  left: number;
  line: number;
  right: number;
  top: number;
};

type HighlightVariant = "primary" | "secondary";

type FixationCandidate = {
  index: number;
  startedAt: number;
};

const FIXATION_INITIAL_MS = 90;
const FIXATION_SAME_LINE_MS = 70;
const FIXATION_NEW_LINE_MS = 135;
const POINT_STALE_AFTER_MS = 650;
const CLEAR_HIGHLIGHT_AFTER_MS = 1500;
const PRIMARY_TOKEN_STYLES: ReadonlyArray<readonly [string, string]> = [
  ["background-color", "rgba(96, 165, 250, 0.28)"],
  ["box-shadow", "0 0 0 1px rgba(96, 165, 250, 0.38)"],
];
const SECONDARY_TOKEN_STYLES: ReadonlyArray<readonly [string, string]> = [
  ["background-color", "rgba(147, 197, 253, 0.16)"],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAxisDistance(position: number, start: number, end: number) {
  if (position < start) {
    return start - position;
  }

  if (position > end) {
    return position - end;
  }

  return 0;
}

function buildWordLayouts(container: HTMLElement) {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>("[data-token-id][data-token-kind='word']")
  );

  const layouts: WordLayout[] = [];
  let currentLine = -1;
  let currentLineCenterY = 0;
  let currentLineHeight = 0;

  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      continue;
    }

    const centerY = rect.top + rect.height / 2;
    const tolerance =
      currentLine < 0
        ? 0
        : Math.max(Math.min(currentLineHeight, rect.height) * 0.75, 12);

    if (currentLine < 0 || Math.abs(centerY - currentLineCenterY) > tolerance) {
      currentLine += 1;
      currentLineCenterY = centerY;
      currentLineHeight = rect.height;
    } else {
      currentLineCenterY = (currentLineCenterY + centerY) / 2;
      currentLineHeight = (currentLineHeight + rect.height) / 2;
    }

    layouts.push({
      bottom: rect.bottom,
      centerX: rect.left + rect.width / 2,
      centerY,
      element,
      height: rect.height,
      index: layouts.length,
      left: rect.left,
      line: currentLine,
      right: rect.right,
      top: rect.top,
    });
  }

  return layouts;
}

function getFixationThreshold(
  candidateIndex: number,
  activeIndex: number | null,
  layouts: WordLayout[]
) {
  if (activeIndex === null) {
    return FIXATION_INITIAL_MS;
  }

  const activeLayout = layouts[activeIndex];
  const candidateLayout = layouts[candidateIndex];
  if (!activeLayout || !candidateLayout) {
    return FIXATION_INITIAL_MS;
  }

  return activeLayout.line === candidateLayout.line
    ? FIXATION_SAME_LINE_MS
    : FIXATION_NEW_LINE_MS;
}

function getPhraseIndices(activeIndex: number, layouts: WordLayout[]) {
  const activeLayout = layouts[activeIndex];
  if (!activeLayout) {
    return [];
  }

  const phraseIndices: number[] = [];
  const previousLayout = layouts[activeIndex - 1];
  const nextLayout = layouts[activeIndex + 1];

  if (previousLayout && previousLayout.line === activeLayout.line) {
    phraseIndices.push(previousLayout.index);
  }

  phraseIndices.push(activeLayout.index);

  if (nextLayout && nextLayout.line === activeLayout.line) {
    phraseIndices.push(nextLayout.index);
  }

  return phraseIndices;
}

function pickWordIndex(
  layouts: WordLayout[],
  x: number,
  y: number,
  activeIndex: number | null
) {
  if (layouts.length === 0) {
    return null;
  }

  const preferredLine = activeIndex === null ? null : layouts[activeIndex]?.line ?? null;
  let bestIndex: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const layout of layouts) {
    const horizontalDistance = getAxisDistance(x, layout.left, layout.right);
    const verticalDistance = getAxisDistance(y, layout.top, layout.bottom);
    let score =
      verticalDistance * 8 +
      horizontalDistance * 1.1 +
      Math.abs(layout.centerX - x) * 0.08;

    if (preferredLine !== null && layout.line === preferredLine) {
      score -= 18;
    }

    if (score < bestScore) {
      bestScore = score;
      bestIndex = layout.index;
    }
  }

  return bestIndex;
}

function clearStyles(element: HTMLElement) {
  for (const [property] of PRIMARY_TOKEN_STYLES) {
    element.style.removeProperty(property);
  }

  for (const [property] of SECONDARY_TOKEN_STYLES) {
    element.style.removeProperty(property);
  }
}

function applyStyles(element: HTMLElement, variant: HighlightVariant) {
  const styles = variant === "primary" ? PRIMARY_TOKEN_STYLES : SECONDARY_TOKEN_STYLES;

  for (const [property, value] of styles) {
    element.style.setProperty(property, value);
  }
}

export function useGazeTokenHighlight({
  containerRef,
  highlightTokensBeingLookedAt = true,
}: UseGazeTokenHighlightParams) {
  const { useLocalCalibration, lastOffsetX, lastOffsetY } = useAppSelector(
    (state) => state.experiment.stepThree
  );
  const wordLayoutsRef = useRef<WordLayout[]>([]);
  const activeWordIndexRef = useRef<number | null>(null);
  const highlightedElementsRef = useRef<Map<HTMLElement, HighlightVariant>>(new Map());
  const fixationCandidateRef = useRef<FixationCandidate | null>(null);
  const latestPointRef = useRef<GazePoint | null>(null);
  const normalizedPointRef = useRef<GazePoint | null>(null);
  const lastValidPointAtRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let refreshFrameId = 0;
    let renderFrameId = 0;

    const setActiveWord = (nextIndex: number | null, force = false) => {
      if (!force && activeWordIndexRef.current === nextIndex) {
        return;
      }

      const nextHighlights = new Map<HTMLElement, HighlightVariant>();

      if (nextIndex !== null) {
        for (const phraseIndex of getPhraseIndices(nextIndex, wordLayoutsRef.current)) {
          const layout = wordLayoutsRef.current[phraseIndex];
          if (!layout) {
            continue;
          }

          nextHighlights.set(
            layout.element,
            phraseIndex === nextIndex ? "primary" : "secondary"
          );
        }
      }

      for (const [element, previousVariant] of highlightedElementsRef.current) {
        const nextVariant = nextHighlights.get(element);
        if (!nextVariant || nextVariant !== previousVariant) {
          clearStyles(element);
          delete element.dataset.gazeActive;
          delete element.dataset.gazePhrase;
        }
      }

      for (const [element, variant] of nextHighlights) {
        const previousVariant = highlightedElementsRef.current.get(element);
        if (
          highlightTokensBeingLookedAt &&
          (!previousVariant || previousVariant !== variant)
        ) {
          clearStyles(element);
          applyStyles(element, variant);
        }

        element.dataset.gazePhrase = variant;
        if (variant === "primary") {
          element.dataset.gazeActive = "true";
        } else {
          delete element.dataset.gazeActive;
        }
      }

      highlightedElementsRef.current = nextHighlights;
      activeWordIndexRef.current = nextIndex;
    };

    const refreshLayouts = () => {
      wordLayoutsRef.current = buildWordLayouts(container);

      if (activeWordIndexRef.current !== null) {
        if (wordLayoutsRef.current[activeWordIndexRef.current]) {
          setActiveWord(activeWordIndexRef.current, true);
        } else {
          fixationCandidateRef.current = null;
          setActiveWord(null, true);
        }
      }
    };

    const scheduleRefresh = () => {
      if (refreshFrameId !== 0) {
        return;
      }

      refreshFrameId = window.requestAnimationFrame(() => {
        refreshFrameId = 0;
        refreshLayouts();
      });
    };

    refreshLayouts();

    const mutationObserver = new MutationObserver(scheduleRefresh);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    const resizeObserver = new ResizeObserver(scheduleRefresh);
    resizeObserver.observe(container);
    if (container.firstElementChild instanceof HTMLElement) {
      resizeObserver.observe(container.firstElementChild);
    }

    const onScroll = () => {
      scheduleRefresh();
    };

    const onResize = () => {
      scheduleRefresh();
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const unsubscribeGaze = subscribeToGaze((sample) => {
      const nextPoint = applyGazeOffset(
        calculateGazePoint(sample),
        lastOffsetX,
        lastOffsetY,
        useLocalCalibration
      );
      if (!nextPoint) {
        return;
      }

      latestPointRef.current = nextPoint;
      lastValidPointAtRef.current = performance.now();
    });

    const render = (now: number) => {
      const latestPoint = latestPointRef.current;
      if (!latestPoint) {
        setActiveWord(null);
        renderFrameId = window.requestAnimationFrame(render);
        return;
      }

      const pointAgeMs = now - lastValidPointAtRef.current;
      if (pointAgeMs > CLEAR_HIGHLIGHT_AFTER_MS) {
        normalizedPointRef.current = null;
        fixationCandidateRef.current = null;
        setActiveWord(null);
        renderFrameId = window.requestAnimationFrame(render);
        return;
      }

      if (pointAgeMs > POINT_STALE_AFTER_MS) {
        renderFrameId = window.requestAnimationFrame(render);
        return;
      }

      const normalizedPoint = normalizeGazePoint(normalizedPointRef.current, latestPoint);
      normalizedPointRef.current = normalizedPoint;

      const x = clamp(normalizedPoint.x * window.innerWidth, 0, window.innerWidth);
      const y = clamp(normalizedPoint.y * window.innerHeight, 0, window.innerHeight);

      const candidateIndex = pickWordIndex(
        wordLayoutsRef.current,
        x,
        y,
        activeWordIndexRef.current
      );

      if (candidateIndex === null) {
        renderFrameId = window.requestAnimationFrame(render);
        return;
      }

      if (candidateIndex === activeWordIndexRef.current) {
        fixationCandidateRef.current = null;
        renderFrameId = window.requestAnimationFrame(render);
        return;
      }

      const fixationCandidate = fixationCandidateRef.current;
      if (!fixationCandidate || fixationCandidate.index !== candidateIndex) {
        fixationCandidateRef.current = {
          index: candidateIndex,
          startedAt: now,
        };
        renderFrameId = window.requestAnimationFrame(render);
        return;
      }

      const fixationThreshold = getFixationThreshold(
        candidateIndex,
        activeWordIndexRef.current,
        wordLayoutsRef.current
      );

      if (now - fixationCandidate.startedAt >= fixationThreshold) {
        fixationCandidateRef.current = null;
        setActiveWord(candidateIndex);
      }

      renderFrameId = window.requestAnimationFrame(render);
    };

    renderFrameId = window.requestAnimationFrame(render);

    return () => {
      if (refreshFrameId !== 0) {
        window.cancelAnimationFrame(refreshFrameId);
      }

      window.cancelAnimationFrame(renderFrameId);
      unsubscribeGaze();
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      fixationCandidateRef.current = null;
      normalizedPointRef.current = null;
      setActiveWord(null, true);
      wordLayoutsRef.current = [];
    };
  }, [containerRef, highlightTokensBeingLookedAt, lastOffsetX, lastOffsetY, useLocalCalibration]);
}
