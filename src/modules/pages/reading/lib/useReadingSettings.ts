"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const FONT_SIZE_OPTIONS = [16, 18, 20, 22] as const;
export const LINE_WIDTH_OPTIONS = [560, 680, 820] as const;

const FONT_SIZE_KEY = "reading:fontSizePx";
const LINE_WIDTH_KEY = "reading:lineWidthPx";
const DEFAULT_FONT_SIZE = 18;
const DEFAULT_LINE_WIDTH = 680;

const settingsListeners = new Set<() => void>();

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
function emitSettingsChange() {
  for (const listener of settingsListeners) {
    listener();
  }
}

function subscribeToReadingSettings(listener: () => void) {
  settingsListeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      settingsListeners.delete(listener);
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (
      event.storageArea === window.localStorage &&
      (event.key === null || event.key === FONT_SIZE_KEY || event.key === LINE_WIDTH_KEY)
    ) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    settingsListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeStoredNumber(key: string, value: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, String(value));
  emitSettingsChange();
}

function getFontSizeSnapshot() {
  return clampToOptions(
    readStoredNumber(FONT_SIZE_KEY),
    FONT_SIZE_OPTIONS,
    DEFAULT_FONT_SIZE
  );
}

function getLineWidthSnapshot() {
  return clampToOptions(
    readStoredNumber(LINE_WIDTH_KEY),
    LINE_WIDTH_OPTIONS,
    DEFAULT_LINE_WIDTH
  );
}

export function useReadingSettings() {
  const fontSizePx = useSyncExternalStore(
    subscribeToReadingSettings,
    getFontSizeSnapshot,
    () => DEFAULT_FONT_SIZE
  );
  const lineWidthPx = useSyncExternalStore(
    subscribeToReadingSettings,
    getLineWidthSnapshot,
    () => DEFAULT_LINE_WIDTH
  );

  const fontIndex = useMemo(
    () => FONT_SIZE_OPTIONS.findIndex((option) => option === fontSizePx),
    [fontSizePx]
  );

  const widthIndex = useMemo(
    () => LINE_WIDTH_OPTIONS.findIndex((option) => option === lineWidthPx),
    [lineWidthPx]
  );

  const setFontSizePx = useCallback((value: number) => {
    writeStoredNumber(
      FONT_SIZE_KEY,
      clampToOptions(value, FONT_SIZE_OPTIONS, DEFAULT_FONT_SIZE)
    );
  }, []);

  const setLineWidthPx = useCallback((value: number) => {
    writeStoredNumber(
      LINE_WIDTH_KEY,
      clampToOptions(value, LINE_WIDTH_OPTIONS, DEFAULT_LINE_WIDTH)
    );
  }, []);

  const increaseFontSize = useCallback(() => {
    if (fontIndex >= 0 && fontIndex < FONT_SIZE_OPTIONS.length - 1) {
      writeStoredNumber(FONT_SIZE_KEY, FONT_SIZE_OPTIONS[fontIndex + 1]);
    }
  }, [fontIndex]);

  const decreaseFontSize = useCallback(() => {
    if (fontIndex > 0) {
      writeStoredNumber(FONT_SIZE_KEY, FONT_SIZE_OPTIONS[fontIndex - 1]);
    }
  }, [fontIndex]);

  const increaseLineWidth = useCallback(() => {
    if (widthIndex >= 0 && widthIndex < LINE_WIDTH_OPTIONS.length - 1) {
      writeStoredNumber(LINE_WIDTH_KEY, LINE_WIDTH_OPTIONS[widthIndex + 1]);
    }
  }, [widthIndex]);

  const decreaseLineWidth = useCallback(() => {
    if (widthIndex > 0) {
      writeStoredNumber(LINE_WIDTH_KEY, LINE_WIDTH_OPTIONS[widthIndex - 1]);
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
