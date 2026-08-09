"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ColorScheme } from "@prisma/client";
import { COLOR_SCHEME_META } from "@/lib/color-schemes";
import { apiSend } from "@/lib/client-fetch";

interface ThemeContextValue {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  initialScheme,
  children,
}: {
  initialScheme: ColorScheme;
  children: React.ReactNode;
}) {
  const [scheme, setSchemeState] = useState<ColorScheme>(initialScheme);

  const setScheme = useCallback((next: ColorScheme) => {
    // Update immediately so the whole app re-themes with no page refresh;
    // persistence is best-effort in the background.
    setSchemeState(next);
    apiSend("/api/settings", "PATCH", { colorScheme: next }).catch(() => {
      // A failed save just means the preference doesn't stick past this
      // session — not worth surfacing as an error for a cosmetic setting.
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ scheme, setScheme }}>
      <div data-scheme={COLOR_SCHEME_META[scheme].attr} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
