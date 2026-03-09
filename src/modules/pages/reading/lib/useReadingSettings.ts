"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const FONT_SIZE_OPTIONS = [16, 18, 20, 22] as const;
export const LETTER_SPACING_OPTIONS = [-0.01, 0, 0.01, 0.02] as const;
export const WORD_SPACING_OPTIONS = [0, 0.04, 0.08, 0.12] as const;
export const FONT_FAMILY_OPTIONS = [
  {
    value: "geist",
    label: "Geist",
    family: "var(--font-geist-sans)",
  },
  {
    value: "inter",
    label: "Inter",
    family: "var(--font-inter)",
  },
  {
    value: "space-grotesk",
    label: "Space Grotesk",
    family: "var(--font-space-grotesk)",
  },
  {
    value: "merriweather",
    label: "Merriweather",
    family: "var(--font-merriweather)",
  },
] as const;

const FONT_SIZE_KEY = "reading:fontSizePx";
const LETTER_SPACING_KEY = "reading:letterSpacingEm";
const WORD_SPACING_KEY = "reading:wordSpacingEm";
const FONT_FAMILY_KEY = "reading:fontFamily";
const DEFAULT_FONT_SIZE = 18;
const DEFAULT_LETTER_SPACING = 0;
const DEFAULT_WORD_SPACING = 0.04;
const DEFAULT_FONT_FAMILY = "geist";

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

function readStoredString(key: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const value = window.localStorage.getItem(key);
  return value ?? undefined;
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

function clampToStringOptions<T extends readonly { value: string }[]>(
  value: string | undefined,
  options: T,
  fallback: T[number]["value"]
): T[number]["value"] {
  if (value !== undefined && options.some((option) => option.value === value)) {
    return value as T[number]["value"];
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
      (
        event.key === null ||
        event.key === FONT_SIZE_KEY ||
        event.key === LETTER_SPACING_KEY ||
        event.key === WORD_SPACING_KEY ||
        event.key === FONT_FAMILY_KEY
      )
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

function getLetterSpacingSnapshot() {
  return clampToOptions(
    readStoredNumber(LETTER_SPACING_KEY),
    LETTER_SPACING_OPTIONS,
    DEFAULT_LETTER_SPACING
  );
}

function getWordSpacingSnapshot() {
  return clampToOptions(
    readStoredNumber(WORD_SPACING_KEY),
    WORD_SPACING_OPTIONS,
    DEFAULT_WORD_SPACING
  );
}

function getFontFamilySnapshot() {
  return clampToStringOptions(
    readStoredString(FONT_FAMILY_KEY),
    FONT_FAMILY_OPTIONS,
    DEFAULT_FONT_FAMILY
  );
}

export function useReadingSettings() {
  const fontSizePx = useSyncExternalStore(
    subscribeToReadingSettings,
    getFontSizeSnapshot,
    () => DEFAULT_FONT_SIZE
  );
  const letterSpacingEm = useSyncExternalStore(
    subscribeToReadingSettings,
    getLetterSpacingSnapshot,
    () => DEFAULT_LETTER_SPACING
  );
  const wordSpacingEm = useSyncExternalStore(
    subscribeToReadingSettings,
    getWordSpacingSnapshot,
    () => DEFAULT_WORD_SPACING
  );
  const fontFamily = useSyncExternalStore(
    subscribeToReadingSettings,
    getFontFamilySnapshot,
    () => DEFAULT_FONT_FAMILY
  );

  const fontIndex = useMemo(
    () => FONT_SIZE_OPTIONS.findIndex((option) => option === fontSizePx),
    [fontSizePx]
  );

  const letterSpacingIndex = useMemo(
    () => LETTER_SPACING_OPTIONS.findIndex((option) => option === letterSpacingEm),
    [letterSpacingEm]
  );

  const wordSpacingIndex = useMemo(
    () => WORD_SPACING_OPTIONS.findIndex((option) => option === wordSpacingEm),
    [wordSpacingEm]
  );

  const fontFamilyIndex = useMemo(
    () => FONT_FAMILY_OPTIONS.findIndex((option) => option.value === fontFamily),
    [fontFamily]
  );

  const setFontSizePx = useCallback((value: number) => {
    writeStoredNumber(
      FONT_SIZE_KEY,
      clampToOptions(value, FONT_SIZE_OPTIONS, DEFAULT_FONT_SIZE)
    );
  }, []);

  const setLetterSpacingEm = useCallback((value: number) => {
    writeStoredNumber(
      LETTER_SPACING_KEY,
      clampToOptions(value, LETTER_SPACING_OPTIONS, DEFAULT_LETTER_SPACING)
    );
  }, []);

  const setWordSpacingEm = useCallback((value: number) => {
    writeStoredNumber(
      WORD_SPACING_KEY,
      clampToOptions(value, WORD_SPACING_OPTIONS, DEFAULT_WORD_SPACING)
    );
  }, []);

  const setFontFamily = useCallback((value: string) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      FONT_FAMILY_KEY,
      clampToStringOptions(value, FONT_FAMILY_OPTIONS, DEFAULT_FONT_FAMILY)
    );
    emitSettingsChange();
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

  const increaseLetterSpacing = useCallback(() => {
    if (letterSpacingIndex >= 0 && letterSpacingIndex < LETTER_SPACING_OPTIONS.length - 1) {
      writeStoredNumber(
        LETTER_SPACING_KEY,
        LETTER_SPACING_OPTIONS[letterSpacingIndex + 1]
      );
    }
  }, [letterSpacingIndex]);

  const decreaseLetterSpacing = useCallback(() => {
    if (letterSpacingIndex > 0) {
      writeStoredNumber(
        LETTER_SPACING_KEY,
        LETTER_SPACING_OPTIONS[letterSpacingIndex - 1]
      );
    }
  }, [letterSpacingIndex]);

  const increaseWordSpacing = useCallback(() => {
    if (wordSpacingIndex >= 0 && wordSpacingIndex < WORD_SPACING_OPTIONS.length - 1) {
      writeStoredNumber(
        WORD_SPACING_KEY,
        WORD_SPACING_OPTIONS[wordSpacingIndex + 1]
      );
    }
  }, [wordSpacingIndex]);

  const decreaseWordSpacing = useCallback(() => {
    if (wordSpacingIndex > 0) {
      writeStoredNumber(
        WORD_SPACING_KEY,
        WORD_SPACING_OPTIONS[wordSpacingIndex - 1]
      );
    }
  }, [wordSpacingIndex]);

  const cycleFontFamily = useCallback(() => {
    const nextIndex =
      fontFamilyIndex >= FONT_FAMILY_OPTIONS.length - 1 ? 0 : fontFamilyIndex + 1;
    setFontFamily(FONT_FAMILY_OPTIONS[nextIndex].value);
  }, [fontFamilyIndex, setFontFamily]);

  return {
    fontSizePx,
    letterSpacingEm,
    wordSpacingEm,
    fontFamily,
    fontFamilyLabel:
      FONT_FAMILY_OPTIONS.find((option) => option.value === fontFamily)?.label ?? "Serif",
    fontFamilyStyle:
      FONT_FAMILY_OPTIONS.find((option) => option.value === fontFamily)?.family ??
      FONT_FAMILY_OPTIONS[0].family,
    setFontSizePx,
    setLetterSpacingEm,
    setWordSpacingEm,
    setFontFamily,
    increaseFontSize,
    decreaseFontSize,
    increaseLetterSpacing,
    decreaseLetterSpacing,
    increaseWordSpacing,
    decreaseWordSpacing,
    cycleFontFamily,
  };
}
