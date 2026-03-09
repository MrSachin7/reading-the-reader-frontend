"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FONT_SIZE_OPTIONS,
  LETTER_SPACING_OPTIONS,
  WORD_SPACING_OPTIONS,
} from "@/modules/pages/reading/lib/useReadingSettings";

type ReadingToolbarProps = {
  estimatedTimeLabel: string;
  fontSizePx: number;
  letterSpacingEm: number;
  wordSpacingEm: number;
  fontFamilyLabel: string;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
  onIncreaseLetterSpacing: () => void;
  onDecreaseLetterSpacing: () => void;
  onIncreaseWordSpacing: () => void;
  onDecreaseWordSpacing: () => void;
  onCycleFontFamily: () => void;
  onReset: () => void;
  onEnterFocus: () => void;
};

export function ReadingToolbar({
  estimatedTimeLabel,
  fontSizePx,
  letterSpacingEm,
  wordSpacingEm,
  fontFamilyLabel,
  onIncreaseFont,
  onDecreaseFont,
  onIncreaseLetterSpacing,
  onDecreaseLetterSpacing,
  onIncreaseWordSpacing,
  onDecreaseWordSpacing,
  onCycleFontFamily,
  onReset,
  onEnterFocus,
}: ReadingToolbarProps) {
  const canDecreaseFont = fontSizePx > FONT_SIZE_OPTIONS[0];
  const canIncreaseFont = fontSizePx < FONT_SIZE_OPTIONS[FONT_SIZE_OPTIONS.length - 1];
  const canDecreaseLetterSpacing = letterSpacingEm > LETTER_SPACING_OPTIONS[0];
  const canIncreaseLetterSpacing =
    letterSpacingEm < LETTER_SPACING_OPTIONS[LETTER_SPACING_OPTIONS.length - 1];
  const canDecreaseWordSpacing = wordSpacingEm > WORD_SPACING_OPTIONS[0];
  const canIncreaseWordSpacing =
    wordSpacingEm < WORD_SPACING_OPTIONS[WORD_SPACING_OPTIONS.length - 1];

  return (
    <div className="sticky top-0 z-20 border-b bg-card/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/">Back</Link>
        </Button>

        <Separator orientation="vertical" className="hidden h-6 md:block" />

        <p className="text-sm text-muted-foreground">{estimatedTimeLabel}</p>

        <Separator orientation="vertical" className="hidden h-6 md:block" />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={onDecreaseFont}
            disabled={!canDecreaseFont}
            aria-label="Decrease font size"
          >
            A-
          </Button>
          <span className="w-16 text-center text-xs text-muted-foreground">{fontSizePx}px</span>
          <Button
            variant="outline"
            size="xs"
            onClick={onIncreaseFont}
            disabled={!canIncreaseFont}
            aria-label="Increase font size"
          >
            A+
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={onDecreaseLetterSpacing}
            disabled={!canDecreaseLetterSpacing}
            aria-label="Decrease letter spacing"
          >
            T-
          </Button>
          <span className="w-16 text-center text-xs text-muted-foreground">
            {letterSpacingEm.toFixed(2)}em
          </span>
          <Button
            variant="outline"
            size="xs"
            onClick={onIncreaseLetterSpacing}
            disabled={!canIncreaseLetterSpacing}
            aria-label="Increase letter spacing"
          >
            T+
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={onDecreaseWordSpacing}
            disabled={!canDecreaseWordSpacing}
            aria-label="Decrease word spacing"
          >
            W-
          </Button>
          <span className="w-16 text-center text-xs text-muted-foreground">
            {wordSpacingEm.toFixed(2)}em
          </span>
          <Button
            variant="outline"
            size="xs"
            onClick={onIncreaseWordSpacing}
            disabled={!canIncreaseWordSpacing}
            aria-label="Increase word spacing"
          >
            W+
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={onCycleFontFamily}>
          {fontFamilyLabel}
        </Button>

        <div className="ml-auto" />

        <Button variant="secondary" size="sm" onClick={onReset}>
          Reset
        </Button>
        <Button size="sm" onClick={onEnterFocus}>
          Focus
        </Button>
      </div>
    </div>
  );
}
