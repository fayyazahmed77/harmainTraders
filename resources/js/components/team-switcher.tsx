"use client"

import * as React from "react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"


export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent hover:text-sidebar-foreground focus-visible:ring-0"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
            <img src="/storage/img/favicon.png" className="size-7 object-contain" alt="Favicon" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xl">Harmain</span> <span className="font-semibold text-sidebar-primary text-xl">Traders</span>
            </div>
            <span className="text-xs">Wholesale <span className="text-sidebar-primary">&</span> Supply Chain</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
