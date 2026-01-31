import { Link, usePage } from "@inertiajs/react"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { url } = usePage()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu className="gap-4">
        {items.map((item) => {
          // Check if any child matches current URL
          const isChildActive = !!item.items?.some((sub) => url.startsWith(sub.url))
          const isDirectActive = url === item.url

          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isDirectActive} tooltip={item.title} className="flex-row items-center h-11 px-3 gap-3 data-[active=true]:bg-neutral-100 dark:data-[active=true]:bg-neutral-800 rounded-lg transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 group">
                  <Link href={item.url} className="flex flex-row items-center w-full gap-3">
                    {item.icon && <item.icon className="size-5 text-neutral-500 group-data-[active=true]:text-neutral-900 dark:text-neutral-400 dark:group-data-[active=true]:text-neutral-100 transition-colors" />}
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-data-[active=true]:text-neutral-900 dark:group-data-[active=true]:text-neutral-100">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isChildActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={isChildActive} className="flex-row items-center h-11 px-3 gap-3 data-[active=true]:bg-neutral-100 dark:data-[active=true]:bg-neutral-800 rounded-lg transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 relative group">
                    {item.icon && <item.icon className="size-5 text-neutral-500 group-data-[active=true]:text-neutral-900 dark:text-neutral-400 dark:group-data-[active=true]:text-neutral-100 transition-colors" />}
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-data-[active=true]:text-neutral-900 dark:group-data-[active=true]:text-neutral-100">
                      {item.title}
                    </span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 size-4 text-neutral-400" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive = url.startsWith(subItem.url)
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubActive}>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
