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
  History,
  ArrowRightLeft,
  MessageSquare,
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
import { usePage } from "@inertiajs/react"
import { User } from "@/types"

interface PageProps {
  auth: {
    user: User;
    roles: string[];
  };
  [key: string]: unknown;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;
  const roles = auth.roles || [];
  const isInvestor = roles.includes('investor');

  const navMain = [
    {
      title: "Dashboard",
      url: isInvestor ? "/investor/dashboard" : "/dashboard",
      icon: LayoutGrid,
    },
    {
      title: "Setup",
      url: "#",
      icon: SquareTerminal,
      roles: ['Admin', 'Sales man'],
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
          title: "Supplier Category",
          url: "/account-category",
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
          title: "Cheque Books",
          url: "/cheque",
        },
      ],
    },
    {
      title: "Daily",
      url: "#",
      icon: Bot,
      roles: ['Admin', 'Sales man'],
      items: [
        {
          title: "Offer List",
          url: "/offer-list",
        },
        {
          title: "Create Offer",
          url: "/offer-list/create",
        },

        {
          title: "Payment List",
          url: "/payments",
        },
        {
          title: "Receipt | Payment",
          url: "/payments/create",
        },
        {
          title: "Purchase List",
          url: "/purchase",
        },
        {
          title: "Create Purchase",
          url: "/purchase/create",
        },
        {
          title: "Purchase Return",
          url: "/purchase-return",
        },
        {
          title: "Sales List",
          url: "/sales",
        },
        {
          title: "Create Sales",
          url: "/sales/create",
        },
        {
          title: "Sales Return",
          url: "/sales-return",
        },
        {
          title: "Cheque Clearing",
          url: "/clearing-cheque",
        },
        {
          title: "Journal Voucher",
          url: "/journal-vouchers",
        },
      ],
    },
    {
      title: "Investor Management",
      url: "#",
      icon: BookKey,
      roles: ['Admin'],
      items: [
        {
          title: "Investors",
          url: "/admin/investors",
        },
        {
          title: "Profit Distribution",
          url: "/admin/profit/distribute",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: BookOpen,
      roles: ['Admin'],
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
          url: "/reports/stock",
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: Settings2,
      roles: ['Admin'],
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
      roles: ['Admin'],
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
        {
          title: "Email Configuration",
          url: "/admin/settings/email",
        },
        {
          title: "Email Templates",
          url: "/admin/settings/templates",
        },

      ],
    },
    {
      title: "Administration",
      url: "#",
      icon: Users,
      roles: ['Admin'],
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
    {
      title: "Profit History",
      url: "/investor/profit/history",
      icon: History,
      roles: ['investor'],
    },
    {
      title: "Transactions",
      url: "/investor/transactions",
      icon: ArrowRightLeft,
      roles: ['investor'],
    },
    {
      title: "Requests",
      url: "/investor/requests",
      icon: MessageSquare,
      roles: ['investor'],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="custom-scrollbar">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
