"use client";

import { type RefObject, useEffect, useRef } from "react";

import { subscribeToGaze } from "@/lib/gaze-socket";
import {
  calculateGazePoint,
  normalizeGazePoint,
  type GazePoint,
} from "@/modules/pages/gaze/lib/gaze-helpers";

type UseGazeTokenHighlightParams = {
  containerRef: RefObject<HTMLElement | null>;
};

type PendingLineSwitch = {
  token: HTMLElement;
  startedAt: number;
};

const LINE_SWITCH_DELAY_MS = 90;
const POINT_STALE_AFTER_MS = 650;
const CLEAR_HIGHLIGHT_AFTER_MS = 1500;
const ACTIVE_TOKEN_STYLES: ReadonlyArray<readonly [string, string]> = [
  ["background-color", "rgba(96, 165, 250, 0.24)"],
  ["box-shadow", "0 0 0 1px rgba(96, 165, 250, 0.34)"],
];

function getPointOwnerElement(node: Node | null) {
  if (!node) {
    return null;
  }

  return node.nodeType === Node.TEXT_NODE ? node.parentElement : node instanceof Element ? node : null;
}

function getCaretElementFromPoint(x: number, y: number) {
  const caretPositionFromPoint = (
    document as Document & {
      caretPositionFromPoint?: (x: number, y: number) => CaretPosition | null;
    }
  ).caretPositionFromPoint;
  if (caretPositionFromPoint) {
    const caret = caretPositionFromPoint.call(document, x, y);
    const element = getPointOwnerElement(caret?.offsetNode ?? null);
    if (element) {
      return element;
    }
  }

  if ("caretRangeFromPoint" in document) {
    const caretRangeFromPoint = (
      document as Document & {
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
      }
    ).caretRangeFromPoint;
    const range = caretRangeFromPoint?.call(document, x, y);
    const element = getPointOwnerElement(range?.startContainer ?? null);
    if (element) {
      return element;
    }
  }

  return null;
}

function getTokenElement(target: Element | null, container: HTMLElement) {
  if (!target || !container.contains(target)) {
    return null;
  }

  const token = target.closest<HTMLElement>("[data-token-id]");
  if (!token || !container.contains(token)) {
    return null;
  }

  return token;
}

function getPreferredSearchOrder(target: HTMLElement, x: number) {
  const rect = target.getBoundingClientRect();
  const midpoint = rect.left + rect.width / 2;
  return x >= midpoint ? [1, -1] : [-1, 1];
}

function getTokenVerticalCenter(token: HTMLElement) {
  const rect = token.getBoundingClientRect();
  return rect.top + rect.height / 2;
}

function areTokensOnSameLine(first: HTMLElement, second: HTMLElement) {
  const firstRect = first.getBoundingClientRect();
  const secondRect = second.getBoundingClientRect();
  const firstCenter = firstRect.top + firstRect.height / 2;
  const secondCenter = secondRect.top + secondRect.height / 2;
  const tolerance = Math.max(Math.min(firstRect.height, secondRect.height) * 0.75, 12);

  return Math.abs(firstCenter - secondCenter) <= tolerance;
}

function getHorizontalDistanceToToken(x: number, token: HTMLElement) {
  const rect = token.getBoundingClientRect();
  if (x < rect.left) {
    return rect.left - x;
  }

  if (x > rect.right) {
    return x - rect.right;
  }

  return 0;
}

function getVerticalDistanceToToken(y: number, token: HTMLElement) {
  const rect = token.getBoundingClientRect();
  if (y < rect.top) {
    return rect.top - y;
  }

  if (y > rect.bottom) {
    return y - rect.bottom;
  }

  return 0;
}

function findClosestWordToken(
  target: HTMLElement,
  x: number,
  orderedTokens: HTMLElement[],
  indexById: Map<string, number>
) {
  if (target.dataset.tokenKind === "word") {
    return target;
  }

  const tokenId = target.dataset.tokenId;
  if (!tokenId) {
    return null;
  }

  const startIndex = indexById.get(tokenId);
  if (startIndex === undefined) {
    return null;
  }

  const directions = getPreferredSearchOrder(target, x);
  for (const direction of directions) {
    let index = startIndex + direction;
    while (index >= 0 && index < orderedTokens.length) {
      const candidate = orderedTokens[index];
      if (candidate.dataset.tokenKind === "word") {
        return candidate;
      }
      index += direction;
    }
  }

  return null;
}

function findNearestWordOnLine(
  activeToken: HTMLElement,
  x: number,
  orderedTokens: HTMLElement[],
  indexById: Map<string, number>
) {
  const tokenId = activeToken.dataset.tokenId;
  if (!tokenId) {
    return activeToken;
  }

  const activeIndex = indexById.get(tokenId);
  if (activeIndex === undefined) {
    return activeToken;
  }

  const lineTokens: HTMLElement[] = [activeToken];

  let index = activeIndex - 1;
  while (index >= 0) {
    const candidate = orderedTokens[index];
    index -= 1;

    if (candidate.dataset.tokenKind !== "word") {
      continue;
    }

    if (!areTokensOnSameLine(candidate, activeToken)) {
      break;
    }

    lineTokens.unshift(candidate);
  }

  index = activeIndex + 1;
  while (index < orderedTokens.length) {
    const candidate = orderedTokens[index];
    index += 1;

    if (candidate.dataset.tokenKind !== "word") {
      continue;
    }

    if (!areTokensOnSameLine(candidate, activeToken)) {
      break;
    }

    lineTokens.push(candidate);
  }

  let bestToken = activeToken;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of lineTokens) {
    const distance = getHorizontalDistanceToToken(x, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestToken = candidate;
    }
  }

  return bestToken;
}

function findNearestWordByGeometry(
  x: number,
  y: number,
  orderedTokens: HTMLElement[],
  preferredLineToken: HTMLElement | null
) {
  let bestToken: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of orderedTokens) {
    if (candidate.dataset.tokenKind !== "word") {
      continue;
    }

    const horizontalDistance = getHorizontalDistanceToToken(x, candidate);
    const verticalDistance = getVerticalDistanceToToken(y, candidate);
    let score = horizontalDistance + verticalDistance * 5;

    if (preferredLineToken && areTokensOnSameLine(candidate, preferredLineToken)) {
      score -= 18;
    }

    if (score < bestScore) {
      bestScore = score;
      bestToken = candidate;
    }
  }

  return bestToken;
}

function findWordTokenAtPoint(
  x: number,
  y: number,
  container: HTMLElement,
  orderedTokens: HTMLElement[],
  indexById: Map<string, number>
) {
  const caretElement = getCaretElementFromPoint(x, y);
  const caretToken = getTokenElement(caretElement, container);
  if (caretToken) {
    return findClosestWordToken(caretToken, x, orderedTokens, indexById);
  }

  for (const element of document.elementsFromPoint(x, y)) {
    const token = getTokenElement(element, container);
    if (token) {
      return findClosestWordToken(token, x, orderedTokens, indexById);
    }
  }

  return null;
}

export function useGazeTokenHighlight({ containerRef }: UseGazeTokenHighlightParams) {
  const activeTokenRef = useRef<HTMLElement | null>(null);
  const orderedTokensRef = useRef<HTMLElement[]>([]);
  const tokenIndexByIdRef = useRef<Map<string, number>>(new Map());
  const latestPointRef = useRef<GazePoint | null>(null);
  const smoothedPointRef = useRef<GazePoint | null>(null);
  const lastValidPointAtRef = useRef(0);
  const pendingLineSwitchRef = useRef<PendingLineSwitch | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const refreshTokens = () => {
      const tokens = Array.from(container.querySelectorAll<HTMLElement>("[data-token-id]"));
      orderedTokensRef.current = tokens;
      tokenIndexByIdRef.current = new Map(
        tokens
          .map((token, index) => {
            const tokenId = token.dataset.tokenId;
            return tokenId ? ([tokenId, index] as const) : null;
          })
          .filter((entry): entry is readonly [string, number] => entry !== null)
      );
    };

    refreshTokens();

    const observer = new MutationObserver(refreshTokens);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      orderedTokensRef.current = [];
      tokenIndexByIdRef.current.clear();
    };
  }, [containerRef]);

  useEffect(() => {
    const clearTokenStyles = (token: HTMLElement) => {
      for (const [property] of ACTIVE_TOKEN_STYLES) {
        token.style.removeProperty(property);
      }
    };

    const applyTokenStyles = (token: HTMLElement) => {
      for (const [property, value] of ACTIVE_TOKEN_STYLES) {
        token.style.setProperty(property, value);
      }
    };

    const setActiveToken = (nextToken: HTMLElement | null) => {
      if (activeTokenRef.current === nextToken) {
        return;
      }

      if (activeTokenRef.current) {
        clearTokenStyles(activeTokenRef.current);
        delete activeTokenRef.current.dataset.gazeActive;
      }

      if (nextToken) {
        nextToken.dataset.gazeActive = "true";
        applyTokenStyles(nextToken);
      }

      activeTokenRef.current = nextToken;
    };

    const unsubscribeGaze = subscribeToGaze((sample) => {
      const nextPoint = calculateGazePoint(sample);
      if (!nextPoint) {
        return;
      }

      latestPointRef.current = nextPoint;
      lastValidPointAtRef.current = performance.now();
    });

    let frameId = 0;

    const render = (now: number) => {
      const container = containerRef.current;
      const activeToken =
        activeTokenRef.current && container?.contains(activeTokenRef.current)
          ? activeTokenRef.current
          : null;
      const latestPoint = latestPointRef.current;
      const lastPointAgeMs = latestPoint === null ? Number.POSITIVE_INFINITY : now - lastValidPointAtRef.current;
      const hasFreshPoint = latestPoint !== null && lastPointAgeMs <= POINT_STALE_AFTER_MS;

      if (!container || !latestPoint) {
        smoothedPointRef.current = null;
        pendingLineSwitchRef.current = null;
        setActiveToken(null);
        frameId = window.requestAnimationFrame(render);
        return;
      }

      if (!hasFreshPoint) {
        if (lastPointAgeMs > CLEAR_HIGHLIGHT_AFTER_MS) {
          smoothedPointRef.current = null;
          pendingLineSwitchRef.current = null;
          setActiveToken(null);
        }

        frameId = window.requestAnimationFrame(render);
        return;
      }

      const smoothedPoint = normalizeGazePoint(smoothedPointRef.current, latestPoint);
      smoothedPointRef.current = smoothedPoint;

      const x = smoothedPoint.x * window.innerWidth;
      const y = smoothedPoint.y * window.innerHeight;
      const candidateToken =
        findWordTokenAtPoint(
          x,
          y,
          container,
          orderedTokensRef.current,
          tokenIndexByIdRef.current
        ) ?? findNearestWordByGeometry(x, y, orderedTokensRef.current, activeToken);

      let nextToken = candidateToken;

      if (activeToken && candidateToken && !areTokensOnSameLine(activeToken, candidateToken)) {
        const pendingLineSwitch = pendingLineSwitchRef.current;
        const activeLineCenter = getTokenVerticalCenter(activeToken);
        const candidateLineCenter = getTokenVerticalCenter(candidateToken);
        const lineJumpDistance = Math.abs(candidateLineCenter - activeLineCenter);
        const immediateSwitchThreshold = Math.max(
          Math.min(
            activeToken.getBoundingClientRect().height,
            candidateToken.getBoundingClientRect().height
          ) * 1.25,
          26
        );

        if (lineJumpDistance < immediateSwitchThreshold) {
          if (
            !pendingLineSwitch ||
            !pendingLineSwitch.token.isConnected ||
            !areTokensOnSameLine(pendingLineSwitch.token, candidateToken)
          ) {
            pendingLineSwitchRef.current = {
              token: candidateToken,
              startedAt: now,
            };
          } else if (now - pendingLineSwitch.startedAt >= LINE_SWITCH_DELAY_MS) {
            pendingLineSwitchRef.current = null;
          }

          if (pendingLineSwitchRef.current) {
            nextToken =
              findNearestWordByGeometry(x, y, orderedTokensRef.current, activeToken) ??
              findNearestWordOnLine(
                activeToken,
                x,
                orderedTokensRef.current,
                tokenIndexByIdRef.current
              ) ??
              activeToken;
          } else {
            nextToken =
              findNearestWordByGeometry(x, y, orderedTokensRef.current, candidateToken) ??
              candidateToken;
          }
        } else {
          pendingLineSwitchRef.current = null;
          nextToken =
            findNearestWordByGeometry(x, y, orderedTokensRef.current, candidateToken) ??
            candidateToken;
        }
      } else if (candidateToken) {
        pendingLineSwitchRef.current = null;
        nextToken =
          findNearestWordByGeometry(x, y, orderedTokensRef.current, candidateToken) ??
          findNearestWordOnLine(
            candidateToken,
            x,
            orderedTokensRef.current,
            tokenIndexByIdRef.current
          ) ??
          candidateToken;
      } else {
        pendingLineSwitchRef.current = null;
        nextToken = activeToken;
      }

      setActiveToken(nextToken);
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribeGaze();
      smoothedPointRef.current = null;
      pendingLineSwitchRef.current = null;
      setActiveToken(null);
    };
  }, [containerRef]);
}
