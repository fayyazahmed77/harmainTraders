import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { type BreadcrumbItem } from "@/types"
import { Toaster } from "sonner";
import { NavUser } from "@/components/nav-user"
import FlashMessages from "@/components/FlashMessages";
import { NotificationBell } from "@/components/notification/NotificationBell"
import { usePage } from "@inertiajs/react"
import { User } from "@/types"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { CommandCenterModal } from "@/components/command/CommandCenterModal"
import { ShortcutsHelpModal } from "@/components/command/ShortcutsHelpModal"
import { Search, Keyboard } from "lucide-react"

type SiteHeaderProps = {
  breadcrumbs?: BreadcrumbItem[]
}

interface PageProps {
  auth: {
    user: User;
  };
  [key: string]: unknown;
}

export function SiteHeader({ breadcrumbs }: SiteHeaderProps) {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;

  const {
    isCommandOpen,
    setIsCommandOpen,
    isShortcutsHelpOpen,
    setIsShortcutsHelpOpen,
    isMac,
  } = useKeyboardShortcuts();

  return (
    <>
      <Toaster richColors position="top-right" />
      <FlashMessages />
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
          {/* Left: Sidebar trigger & Breadcrumbs */}
          <div className="flex items-center gap-1 lg:gap-2 min-w-0 shrink-1">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4 hidden sm:block"
            />
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground truncate">
                {breadcrumbs.map((item, index) => (
                  <span key={index} className="flex items-center">
                    <a href={item.href} className="hover:underline text-foreground">
                      {item.title}
                    </a>
                    {index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* Center: Global Search Command Bar Trigger */}
          <div className="flex-1 flex justify-center items-center max-w-xs md:max-w-sm lg:max-w-md mx-2">
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-xs text-neutral-400 dark:text-neutral-500 hover:border-orange-500/50 hover:bg-white dark:hover:bg-neutral-800/90 transition-all duration-200 shadow-2xs group cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-orange-500 transition-colors shrink-0" />
              <span className="truncate text-left font-medium">Search pages, actions...</span>
              <kbd className="ml-auto hidden md:inline-flex items-center gap-0.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shrink-0">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>
          </div>

          {/* Right: Keyboard Shortcut Button, Notification Bell, User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsShortcutsHelpOpen(true)}
              title="Keyboard Shortcuts (?)"
              className="p-2 rounded-xl text-neutral-500 hover:text-orange-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer relative group"
            >
              <Keyboard className="w-4 h-4" />
              <span className="sr-only">Keyboard Shortcuts</span>
            </button>
            <NotificationBell />
            <NavUser user={user} />
          </div>
        </div>
      </header>

      {/* CommandCenter & Shortcuts Help Modals */}
      <CommandCenterModal
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        isMac={isMac}
      />
      <ShortcutsHelpModal
        open={isShortcutsHelpOpen}
        onOpenChange={setIsShortcutsHelpOpen}
        isMac={isMac}
      />
    </>
  )
}

