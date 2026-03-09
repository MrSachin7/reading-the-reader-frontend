"use client";

import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";

type UsePreserveReadingContextParams = {
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  interventionKey: string;
};

type TokenAnchor = {
  tokenId: string;
  centerY: number;
};

type ContextSnapshot = {
  primaryAnchor: TokenAnchor;
  fallbackAnchors: TokenAnchor[];
};

const PRIMARY_ANCHOR_MAX_ERROR_PX = 10;
const FALLBACK_ANCHOR_MAX_ERROR_PX = 18;

function getTokenCenterY(token: HTMLElement) {
  const rect = token.getBoundingClientRect();
  return rect.top + rect.height / 2;
}

function getTokenSelector(tokenId: string) {
  return `[data-token-id="${tokenId.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
}

function captureSnapshot(container: HTMLElement): ContextSnapshot | null {
  const orderedTokens = Array.from(
    container.querySelectorAll<HTMLElement>('[data-token-kind="word"]')
  );

  if (orderedTokens.length === 0) {
    return null;
  }

  const activeToken =
    container.querySelector<HTMLElement>('[data-gaze-active="true"]') ?? null;

  if (!activeToken) {
    return null;
  }

  const activeTokenId = activeToken.dataset.tokenId;
  if (!activeTokenId) {
    return null;
  }

  const activeIndex = orderedTokens.findIndex(
    (token) => token.dataset.tokenId === activeTokenId
  );

  if (activeIndex < 0) {
    return null;
  }

  const candidateIndexes = [
    activeIndex,
    activeIndex - 1,
    activeIndex + 1,
    activeIndex - 2,
    activeIndex + 2,
  ].filter((index, position, array) => {
    return index >= 0 && index < orderedTokens.length && array.indexOf(index) === position;
  });

  const anchors = candidateIndexes
    .map((index) => orderedTokens[index])
    .map((token) => {
      const tokenId = token.dataset.tokenId;
      return tokenId
        ? {
            tokenId,
            centerY: getTokenCenterY(token),
          }
        : null;
    })
    .filter((anchor): anchor is TokenAnchor => anchor !== null);

  if (anchors.length === 0) {
    return null;
  }

  return {
    primaryAnchor: anchors[0],
    fallbackAnchors: anchors.slice(1),
  };
}

function alignAnchor(container: HTMLElement, anchor: TokenAnchor) {
  const token = container.querySelector<HTMLElement>(getTokenSelector(anchor.tokenId));
  if (!token) {
    return null;
  }

  const beforeCenterY = getTokenCenterY(token);
  const beforeDeltaY = beforeCenterY - anchor.centerY;
  const nextScrollTop = container.scrollTop + beforeDeltaY;
  const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 0);
  container.scrollTop = Math.min(Math.max(nextScrollTop, 0), maxScrollTop);

  const afterCenterY = getTokenCenterY(token);
  return Math.abs(afterCenterY - anchor.centerY);
}

function restoreSnapshot(container: HTMLElement, snapshot: ContextSnapshot) {
  const primaryError = alignAnchor(container, snapshot.primaryAnchor);
  if (
    primaryError !== null &&
    primaryError <= PRIMARY_ANCHOR_MAX_ERROR_PX
  ) {
    return true;
  }

  let bestFallback: { anchor: TokenAnchor; error: number } | null = null;

  for (const anchor of snapshot.fallbackAnchors) {
    const error = alignAnchor(container, anchor);
    if (error === null) {
      continue;
    }

    if (!bestFallback || error < bestFallback.error) {
      bestFallback = { anchor, error };
    }
  }

  if (bestFallback && bestFallback.error <= FALLBACK_ANCHOR_MAX_ERROR_PX) {
    alignAnchor(container, bestFallback.anchor);
    return true;
  }

  if (primaryError !== null) {
    alignAnchor(container, snapshot.primaryAnchor);
    return true;
  }

  return false;
}

export function usePreserveReadingContext({
  containerRef,
  enabled,
  interventionKey,
}: UsePreserveReadingContextParams) {
  const latestSnapshotRef = useRef<ContextSnapshot | null>(null);
  const previousInterventionKeyRef = useRef<string | null>(null);

  const captureContextAnchor = useCallback(() => {
    const container = containerRef.current;
    if (!enabled || !container) {
      return;
    }

    latestSnapshotRef.current = captureSnapshot(container);
  }, [containerRef, enabled]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) {
      previousInterventionKeyRef.current = interventionKey;
      return;
    }

    if (previousInterventionKeyRef.current === null) {
      previousInterventionKeyRef.current = interventionKey;
      latestSnapshotRef.current = captureSnapshot(container);
      return;
    }

    if (previousInterventionKeyRef.current === interventionKey) {
      latestSnapshotRef.current = captureSnapshot(container);
      return;
    }

    previousInterventionKeyRef.current = interventionKey;
    const snapshot = latestSnapshotRef.current;

    if (!snapshot) {
      latestSnapshotRef.current = captureSnapshot(container);
      return;
    }

    let frameA = 0;
    let frameB = 0;

    frameA = window.requestAnimationFrame(() => {
      restoreSnapshot(container, snapshot);
      frameB = window.requestAnimationFrame(() => {
        restoreSnapshot(container, snapshot);
        latestSnapshotRef.current = captureSnapshot(container);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameA);
      window.cancelAnimationFrame(frameB);
    };
  }, [containerRef, enabled, interventionKey]);

  return {
    captureContextAnchor,
  };
}
