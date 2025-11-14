import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

/**
 * Minimal theme provider replacement for `next-themes`.
 * - Stores the desired theme state ("light" | "dark" | "system")
 * - Applies an effective theme to document.documentElement.dataset.theme
 * - Exposes `useTheme()` hook compatible with simple usage in the app
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const apply = () => {
      const effective =
        theme === "system"
          ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme

      // set a data attribute so CSS can target [data-theme="dark"] etc.
      document.documentElement.setAttribute("data-theme", effective)
    }

    apply()

    // listen to system changes when theme === "system"
    let mq: MediaQueryList | null = null
    if (theme === "system" && window.matchMedia) {
      mq = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = () => apply()
      mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler)
      return () => {
        mq?.removeEventListener ? mq?.removeEventListener("change", handler) : mq?.removeListener(handler)
      }
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

/** Hook replacement for `next-themes` usage in the project */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // fallback when provider isn't mounted — assume system
    return { theme: "system" as Theme, setTheme: (_: Theme) => {} }
  }
  return ctx
}

export default ThemeProvider
