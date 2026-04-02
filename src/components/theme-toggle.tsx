"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by waiting for mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="rounded-none border-2 h-10 w-10">
        <Sun className="h-[1.2rem] w-[1.2rem] opacity-0" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-none border-2 h-10 w-10 border-border bg-card/50 hover:bg-primary/10 transition-all">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none border-2 border-border bg-background">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="font-black uppercase italic text-[10px] tracking-widest cursor-pointer p-3"
        >
          Light Protocol
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="font-black uppercase italic text-[10px] tracking-widest cursor-pointer p-3"
        >
          Dark Protocol
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
