"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const FONT_SIZE_OPTIONS = [16, 18, 20, 22] as const;
export const LINE_WIDTH_OPTIONS = [560, 680, 820] as const;

const FONT_SIZE_KEY = "reading:fontSizePx";
const LINE_WIDTH_KEY = "reading:lineWidthPx";

function readStoredNumber(key: string): number | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampToOptions<T extends readonly number[]>(
  value: number | undefined,
  options: T,
  fallback: T[number]
): T[number] {
  if (value !== undefined && options.includes(value as T[number])) {
    return value as T[number];
  }

  return fallback;
}

export function useReadingSettings() {
  const [fontSizePx, setFontSizePx] = useState<number>(() =>
    clampToOptions(readStoredNumber(FONT_SIZE_KEY), FONT_SIZE_OPTIONS, 18)
  );
  const [lineWidthPx, setLineWidthPx] = useState<number>(() =>
    clampToOptions(readStoredNumber(LINE_WIDTH_KEY), LINE_WIDTH_OPTIONS, 680)
  );

  useEffect(() => {
    window.localStorage.setItem(FONT_SIZE_KEY, String(fontSizePx));
  }, [fontSizePx]);

  useEffect(() => {
    window.localStorage.setItem(LINE_WIDTH_KEY, String(lineWidthPx));
  }, [lineWidthPx]);

  const fontIndex = useMemo(
    () => FONT_SIZE_OPTIONS.findIndex((option) => option === fontSizePx),
    [fontSizePx]
  );

  const widthIndex = useMemo(
    () => LINE_WIDTH_OPTIONS.findIndex((option) => option === lineWidthPx),
    [lineWidthPx]
  );

  const increaseFontSize = useCallback(() => {
    if (fontIndex >= 0 && fontIndex < FONT_SIZE_OPTIONS.length - 1) {
      setFontSizePx(FONT_SIZE_OPTIONS[fontIndex + 1]);
    }
  }, [fontIndex]);

  const decreaseFontSize = useCallback(() => {
    if (fontIndex > 0) {
      setFontSizePx(FONT_SIZE_OPTIONS[fontIndex - 1]);
    }
  }, [fontIndex]);

  const increaseLineWidth = useCallback(() => {
    if (widthIndex >= 0 && widthIndex < LINE_WIDTH_OPTIONS.length - 1) {
      setLineWidthPx(LINE_WIDTH_OPTIONS[widthIndex + 1]);
    }
  }, [widthIndex]);

  const decreaseLineWidth = useCallback(() => {
    if (widthIndex > 0) {
      setLineWidthPx(LINE_WIDTH_OPTIONS[widthIndex - 1]);
    }
  }, [widthIndex]);

  return {
    fontSizePx,
    lineWidthPx,
    setFontSizePx,
    setLineWidthPx,
    increaseFontSize,
    decreaseFontSize,
    increaseLineWidth,
    decreaseLineWidth,
  };
}
