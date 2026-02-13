"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  BookKey,
  GalleryVerticalEnd,
  LayoutGrid,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "Harmain Traders",
      logo: "/storage/img/user.jpg",
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutGrid,
    },
    {
      title: "Setup",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Accounts",
          url: "/account",
        },
        {
          title: "Account Types",
          url: "/account-types",
        },
        {
          title: "Areas",
          url: "/areas",
        },
        {
          title: "Subareas",
          url: "/subareas",
        },
        {
          title: "Firm",
          url: "/firms",
        },
        {
          title: "Items",
          url: "/items",
        },
        {
          title: "Items Category",
          url: "/item-categories",
        },

        {
          title: "Messages Line",
          url: "/message-lines",
        },
        {
          title: "Saleman",
          url: "/salemen",
        },

        {
          title: "Cheque Book Generatoin",
          url: "/cheque",
        },
      ],
    },
    {
      title: "Daily",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Offer List",
          url: "/offer-list",
        },
        {
          title: "Payment",
          url: "/payments",
        },
        {
          title: "Purchase ",
          url: "/purchase",
        },
        {
          title: "Purchase Return (Transfer Out)",
          url: "/purchase-return",
        },
        {
          title: "Sales ",
          url: "/sales",
        },
        {
          title: "Sales Return (Credit Note)",
          url: "/sales-return",
        },
        {
          title: "Cheque Clearing",
          url: "/clearing-cheque",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Accounts Report",
          url: "/reports/accounts/ledger",
        },
        {
          title: "Audit",
          url: "/reports/audit",
        },
        {
          title: "Profit Reports",
          url: "/reports/profit",
        },
        {
          title: "Purchase Reports",
          url: "/reports/purchase",
        },
        {
          title: "Purchase Return Reports",
          url: "/reports/purchase-return",
        },
        {
          title: "Sales Reports",
          url: "/reports/sales",
        },
        {
          title: "Sales Return Reports",
          url: "/reports/sales-return",
        },
        {
          title: "Sales Map Report",
          url: "/reports/sales-map",
        },
        {
          title: "Stock Reports",
          url: "/reports/stock/status",
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Company Waise Order",
          url: "#",
        },
        {
          title: "Supplier Waise Order",
          url: "#",
        },
        {
          title: "Supplier Waise Company",
          url: "#",
        },

      ],
    },
    {
      title: "Setting",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Country",
          url: "/countries",
        },
        {
          title: "States",
          url: "/provinces",
        },
        {
          title: "Cites",
          url: "/cities",
        },

      ],
    },
    {
      title: "Administration",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Staff",
          url: "/staff",
        },
        {
          title: "Roles & Permission",
          url: "/roles/permissions",
        }
      ],
    },
  ],

}

import { usePage } from "@inertiajs/react"
import { User } from "@/types"

interface PageProps {
  auth: {
    user: User;
  };
  [key: string]: unknown;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
