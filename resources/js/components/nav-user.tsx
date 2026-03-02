import {
  BadgeCheck,
  Settings,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react"
import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
declare let route: any;

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
}) {
  const { isMobile } = useSidebar()
  const { appearance, updateAppearance } = useAppearance()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent hover:text-sidebar-foreground focus-visible:ring-0"
            >
              <Avatar className="h-8 w-8 rounded-full border">
                <AvatarImage src={user.avatar || '/storage/img/user.jpg'} alt={user.name} />
                <AvatarFallback className="rounded-full">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>

              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.avatar || '/storage/img/user.jpg'} alt={user.name} />
                  <AvatarFallback className="rounded-full">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link href="/settings" className="w-full cursor-pointer flex items-center gap-2">
                  <Settings className="size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Appearance</div>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => updateAppearance('light')} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sun className="size-4" />
                  <span>Light</span>
                </div>
                {appearance === 'light' && <Check className="size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateAppearance('dark')} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Moon className="size-4" />
                  <span>Dark</span>
                </div>
                {appearance === 'dark' && <Check className="size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateAppearance('system')} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Monitor className="size-4" />
                  <span>System</span>
                </div>
                {appearance === 'system' && <Check className="size-4" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href={route('logout')} method="post" as="button" className="w-full cursor-pointer">
                <LogOut className="size-4" />
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
