"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { FontTheme } from "@/hooks/use-font-theme";

type ReadingPresentationSettings = {
  id: string
  name: string
  fontFamily: FontTheme
  fontSizePx: number
  lineWidthPx: number
  lineHeight: number
  letterSpacingEm: number
  editableByExperimenter: boolean
}

export const FONT_SIZE_MIN = 14;
export const FONT_SIZE_MAX = 28;
export const FONT_SIZE_STEP = 2;
export const LINE_WIDTH_MIN = 520;
export const LINE_WIDTH_MAX = 920;
export const LINE_WIDTH_STEP = 20;

const FONT_SIZE_KEY = "reading:fontSizePx";
const LINE_WIDTH_KEY = "reading:lineWidthPx";
const LINE_HEIGHT_KEY = "reading:lineHeight";
const LETTER_SPACING_KEY = "reading:letterSpacingEm";
const FONT_FAMILY_KEY = "reading:fontFamily";
const EDITABLE_BY_EXPERIMENTER_KEY = "reading:editableByExperimenter";
const EXPERIMENT_SETUP_ID_KEY = "reading:experimentSetupId";
const EXPERIMENT_SETUP_NAME_KEY = "reading:experimentSetupName";

const DEFAULT_FONT_SIZE = 18;
const DEFAULT_LINE_WIDTH = 680;
const DEFAULT_LINE_HEIGHT = 1.8;
const DEFAULT_LETTER_SPACING = 0;
const DEFAULT_FONT_FAMILY: FontTheme = "merriweather";
const DEFAULT_EDITABLE_BY_EXPERIMENTER = true;

const settingsListeners = new Set<() => void>();

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
    if (event.storageArea !== window.localStorage) {
      return;
    }

    listener();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    settingsListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

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

  return window.localStorage.getItem(key) ?? undefined;
}

function readStoredBoolean(key: string): boolean | undefined {
  const value = readStoredString(key);
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function writeStoredValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
  emitSettingsChange();
}

function removeStoredValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
  emitSettingsChange();
}

function clampRange(value: number | undefined, min: number, max: number, fallback: number) {
  if (value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function getFontSizeSnapshot() {
  return clampRange(readStoredNumber(FONT_SIZE_KEY), FONT_SIZE_MIN, FONT_SIZE_MAX, DEFAULT_FONT_SIZE);
}

function getLineWidthSnapshot() {
  return clampRange(readStoredNumber(LINE_WIDTH_KEY), LINE_WIDTH_MIN, LINE_WIDTH_MAX, DEFAULT_LINE_WIDTH);
}

function getLineHeightSnapshot() {
  return clampRange(readStoredNumber(LINE_HEIGHT_KEY), 1.2, 2.2, DEFAULT_LINE_HEIGHT);
}

function getLetterSpacingSnapshot() {
  return clampRange(readStoredNumber(LETTER_SPACING_KEY), 0, 0.12, DEFAULT_LETTER_SPACING);
}

function getFontFamilySnapshot(): FontTheme {
  const value = readStoredString(FONT_FAMILY_KEY);
  if (
    value === "geist" ||
    value === "inter" ||
    value === "space-grotesk" ||
    value === "merriweather"
  ) {
    return value;
  }

  return DEFAULT_FONT_FAMILY;
}

function getEditableByExperimenterSnapshot() {
  return readStoredBoolean(EDITABLE_BY_EXPERIMENTER_KEY) ?? DEFAULT_EDITABLE_BY_EXPERIMENTER;
}

function getExperimentSetupIdSnapshot() {
  return readStoredString(EXPERIMENT_SETUP_ID_KEY) ?? null;
}

function getExperimentSetupNameSnapshot() {
  return readStoredString(EXPERIMENT_SETUP_NAME_KEY) ?? null;
}

export function applyReadingPresentationSettings(setup: ReadingPresentationSettings) {
  writeStoredValue(FONT_SIZE_KEY, String(setup.fontSizePx));
  writeStoredValue(LINE_WIDTH_KEY, String(setup.lineWidthPx));
  writeStoredValue(LINE_HEIGHT_KEY, String(setup.lineHeight));
  writeStoredValue(LETTER_SPACING_KEY, String(setup.letterSpacingEm));
  writeStoredValue(FONT_FAMILY_KEY, setup.fontFamily);
  writeStoredValue(EDITABLE_BY_EXPERIMENTER_KEY, String(setup.editableByExperimenter));
  writeStoredValue(EXPERIMENT_SETUP_ID_KEY, setup.id);
  writeStoredValue(EXPERIMENT_SETUP_NAME_KEY, setup.name);
}

export function clearAppliedExperimentSetup() {
  removeStoredValue(EXPERIMENT_SETUP_ID_KEY);
  removeStoredValue(EXPERIMENT_SETUP_NAME_KEY);
  removeStoredValue(EDITABLE_BY_EXPERIMENTER_KEY);
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
  const lineHeight = useSyncExternalStore(
    subscribeToReadingSettings,
    getLineHeightSnapshot,
    () => DEFAULT_LINE_HEIGHT
  );
  const letterSpacingEm = useSyncExternalStore(
    subscribeToReadingSettings,
    getLetterSpacingSnapshot,
    () => DEFAULT_LETTER_SPACING
  );
  const fontFamily = useSyncExternalStore(
    subscribeToReadingSettings,
    getFontFamilySnapshot,
    () => DEFAULT_FONT_FAMILY
  );
  const editableByExperimenter = useSyncExternalStore(
    subscribeToReadingSettings,
    getEditableByExperimenterSnapshot,
    () => DEFAULT_EDITABLE_BY_EXPERIMENTER
  );
  const experimentSetupId = useSyncExternalStore(
    subscribeToReadingSettings,
    getExperimentSetupIdSnapshot,
    () => null
  );
  const experimentSetupName = useSyncExternalStore(
    subscribeToReadingSettings,
    getExperimentSetupNameSnapshot,
    () => null
  );

  const setFontSizePx = useCallback((value: number) => {
    writeStoredValue(FONT_SIZE_KEY, String(clampRange(value, FONT_SIZE_MIN, FONT_SIZE_MAX, DEFAULT_FONT_SIZE)));
  }, []);

  const setLineWidthPx = useCallback((value: number) => {
    writeStoredValue(LINE_WIDTH_KEY, String(clampRange(value, LINE_WIDTH_MIN, LINE_WIDTH_MAX, DEFAULT_LINE_WIDTH)));
  }, []);

  const setLineHeight = useCallback((value: number) => {
    writeStoredValue(LINE_HEIGHT_KEY, String(clampRange(value, 1.2, 2.2, DEFAULT_LINE_HEIGHT)));
  }, []);

  const setLetterSpacingEm = useCallback((value: number) => {
    writeStoredValue(
      LETTER_SPACING_KEY,
      String(clampRange(value, 0, 0.12, DEFAULT_LETTER_SPACING))
    );
  }, []);

  const setFontFamily = useCallback((value: FontTheme) => {
    writeStoredValue(FONT_FAMILY_KEY, value);
  }, []);

  const setEditableByExperimenter = useCallback((value: boolean) => {
    writeStoredValue(EDITABLE_BY_EXPERIMENTER_KEY, String(value));
  }, []);

  const increaseFontSize = useCallback(() => {
    writeStoredValue(
      FONT_SIZE_KEY,
      String(clampRange(fontSizePx + FONT_SIZE_STEP, FONT_SIZE_MIN, FONT_SIZE_MAX, DEFAULT_FONT_SIZE))
    );
  }, [fontSizePx]);

  const decreaseFontSize = useCallback(() => {
    writeStoredValue(
      FONT_SIZE_KEY,
      String(clampRange(fontSizePx - FONT_SIZE_STEP, FONT_SIZE_MIN, FONT_SIZE_MAX, DEFAULT_FONT_SIZE))
    );
  }, [fontSizePx]);

  const increaseLineWidth = useCallback(() => {
    writeStoredValue(
      LINE_WIDTH_KEY,
      String(clampRange(lineWidthPx + LINE_WIDTH_STEP, LINE_WIDTH_MIN, LINE_WIDTH_MAX, DEFAULT_LINE_WIDTH))
    );
  }, [lineWidthPx]);

  const decreaseLineWidth = useCallback(() => {
    writeStoredValue(
      LINE_WIDTH_KEY,
      String(clampRange(lineWidthPx - LINE_WIDTH_STEP, LINE_WIDTH_MIN, LINE_WIDTH_MAX, DEFAULT_LINE_WIDTH))
    );
  }, [lineWidthPx]);

  const resetReadingSettings = useCallback(() => {
    writeStoredValue(FONT_SIZE_KEY, String(DEFAULT_FONT_SIZE));
    writeStoredValue(LINE_WIDTH_KEY, String(DEFAULT_LINE_WIDTH));
    writeStoredValue(LINE_HEIGHT_KEY, String(DEFAULT_LINE_HEIGHT));
    writeStoredValue(LETTER_SPACING_KEY, String(DEFAULT_LETTER_SPACING));
    writeStoredValue(FONT_FAMILY_KEY, DEFAULT_FONT_FAMILY);
    writeStoredValue(EDITABLE_BY_EXPERIMENTER_KEY, String(DEFAULT_EDITABLE_BY_EXPERIMENTER));
    removeStoredValue(EXPERIMENT_SETUP_ID_KEY);
    removeStoredValue(EXPERIMENT_SETUP_NAME_KEY);
  }, []);

  return {
    fontFamily,
    fontSizePx,
    lineWidthPx,
    lineHeight,
    letterSpacingEm,
    editableByExperimenter,
    experimentSetupId,
    experimentSetupName,
    setFontFamily,
    setFontSizePx,
    setLineWidthPx,
    setLineHeight,
    setLetterSpacingEm,
    setEditableByExperimenter,
    increaseFontSize,
    decreaseFontSize,
    increaseLineWidth,
    decreaseLineWidth,
    resetReadingSettings,
  };
}
