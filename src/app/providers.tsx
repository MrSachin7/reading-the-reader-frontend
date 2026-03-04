"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";

import { FontThemeProvider } from "@/hooks/use-font-theme";
import { PaletteThemeProvider } from "@/hooks/use-palette-theme";
import { ReduxProvider } from "@/redux";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <FontThemeProvider>
          <PaletteThemeProvider>{children}</PaletteThemeProvider>
        </FontThemeProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
