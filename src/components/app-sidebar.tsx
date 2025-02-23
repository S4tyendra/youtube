"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  Home,
  LogOut,
  Map,
  PieChart,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
// import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  // SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/feed",
      icon: Home,
      isActive: true,
    },
    {
      title: "Subscriptions",
      url: "/subscriptions",
      icon: BookOpen,
    },
    {
      title: "History",
      url: "/history",
      icon: PieChart,
    },
    {
      title: "Playlists",
      url: "/playlists",
      icon: Frame,
    },
    {
      title: "Watch Later",
      url: "/watch-later",
      icon: Bot,
    },
    {
      title: "Liked",
      url: "/liked",
      icon: Map,
    },
  ],
  explore: [
    {
      name: "Explore",
      url: "/explore",
      icon: Frame,
    },
    {
      name: "Trending",
      url: "/trending",
      icon: PieChart,
    },
    {
      name: "Shopping",
      url: "/shopping",
      icon: Bot,
    },
    {
      name: "Music",
      url: "/music",
      icon: Home,
    },
    {
      name: "Films",
      url: "/films",
      icon: BookOpen,
    },
    {
      name: "Live",
      url: "/live",
      icon: Map,
    },
    {
      name: "Gaming",
      url: "/gaming",
      icon: Command,
    },
    {
      name: "News",
      url: "/news",
      icon: Frame,
    },
    {
      name: "Sport",
      url: "/sport",
      icon: Bot,
    },
    {
      name: "Courses",
      url: "/courses",
      icon: BookOpen,
    },
    {
      name: "Fashion & Beauty",
      url: "/fashion-beauty",
      icon: Home,
    },
    {
      name: "Podcasts",
      url: "/podcasts",
      icon: SquareTerminal,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // use router
  const router = useRouter()
  const handleLogout = () => {
    // Delete youtube_user_id from local storage
    localStorage.removeItem("youtube_user_id")
    router.push("/login")

  }
  return (
    <Sidebar
      className="top-[--header-height] !h-[calc(100svh-var(--header-height))]"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.explore} />
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
      <SidebarFooter>
        <Button onClick={handleLogout} variant={"destructive"}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
