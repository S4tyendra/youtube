"use client"

import { Menu, Search, Youtube } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="fle sticky top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <Button
          className="size-4 rounded-xl"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <Menu className="size-5" />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Youtube className="size-6 text-primary" />
        <span className="text-primary">UTUBE</span>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Search className="size-4" />
            <span className="sr-only">Search</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
