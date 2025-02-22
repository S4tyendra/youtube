"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative h-9 w-9 p-2 hover:bg-accent rounded-xl"
      aria-label="Toggle theme"
    >
      <span className="relative flex items-center justify-center">
        <Sun
          className="absolute size-4 rotate-0 transform transition-all duration-300 dark:-rotate-90 dark:scale-0"
        />
        <Moon
          className="absolute size-4 rotate-90 transform transition-all duration-300 dark:rotate-0 dark:scale-100"
          style={{ opacity: theme === 'dark' ? 1 : 0 }}
        />
      </span>
    </Button>
  )
}