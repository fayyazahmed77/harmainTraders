import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { type BreadcrumbItem } from "@/types"
import { Toaster } from "sonner";
import { NavUser } from "@/components/nav-user"
import FlashMessages from "@/components/FlashMessages";
type SiteHeaderProps = {
  breadcrumbs?: BreadcrumbItem[]
}
import { usePage } from "@inertiajs/react"
import { User } from "@/types"

interface PageProps {
  auth: {
    user: User;
  };
  [key: string]: unknown;
}
export function SiteHeader({ breadcrumbs }: SiteHeaderProps) {
  const { auth } = usePage<PageProps>().props;
    const user = auth.user;
  return (
    <>
    <Toaster richColors position="top-right" />
      <FlashMessages />
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* Breadcrumbs here */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
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
        <div className="ml-auto flex items-center gap-2">
          {/* user */}
          <NavUser user={user} />
        </div>
      </div>
    </header>
    </>
  )
}
