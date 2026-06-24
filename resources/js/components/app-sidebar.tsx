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
      permissions: [
        'view accounts', 'manage accounts',
        'view areas', 'edit areas', 'delete areas',
        'view firms', 'manage firms',
        'view stock', 'manage stock', 'adjust stock',
        'manage staff', 'manage cheques'
      ],
      items: [
        {
          title: "Accounts",
          url: "/account",
          permissions: ['view accounts', 'manage accounts'],
        },
        {
          title: "Account Types",
          url: "/account-types",
          permissions: ['manage accounts'],
        },
        {
          title: "Supplier Category",
          url: "/account-category",
          permissions: ['manage accounts'],
        },
        {
          title: "Areas",
          url: "/areas",
          permissions: ['view areas', 'edit areas', 'delete areas'],
        },
        {
          title: "Subareas",
          url: "/subareas",
          permissions: ['view areas', 'edit areas', 'delete areas'],
        },
        {
          title: "Firm",
          url: "/firms",
          permissions: ['view firms', 'manage firms'],
        },
        {
          title: "Items",
          url: "/items",
          permissions: ['view stock', 'manage stock'],
        },
        {
          title: "Items Category",
          url: "/item-categories",
          permissions: ['manage stock'],
        },
        {
          title: "Messages Line",
          url: "/message-lines",
          permissions: ['view message'],
        },
        {
          title: "Saleman",
          url: "/salemen",
          permissions: ['manage staff'],
        },
        {
          title: "Cheque Books",
          url: "/cheque",
          permissions: ['manage cheques'],
        },
      ],
    },
    {
      title: "Daily",
      url: "#",
      icon: Bot,
      permissions: [
        'view purchases', 'create purchases', 'edit purchases', 'delete purchases',
        'view sales', 'create sales', 'edit sales', 'delete sales',
        'view returns', 'create returns', 'edit returns', 'delete returns',
        'view purchase returns', 'create purchase returns', 'edit purchase returns', 'delete purchase returns',
        'view payments', 'create payments', 'edit payments', 'delete payments',
        'view jv', 'create jv', 'manage jv', 'delete jv',
        'view_journal_vouchers'
      ],
      items: [
        {
          title: "Offer List",
          url: "/offer-list",
          permissions: ['view sales'],
        },
        {
          title: "Create Offer",
          url: "/offer-list/create",
          permissions: ['create sales'],
        },
        {
          title: "Payment List",
          url: "/payments",
          permissions: ['view payments'],
        },
        {
          title: "Receipt | Payment",
          url: "/payments/create",
          permissions: ['create payments'],
        },
        {
          title: "Purchase List",
          url: "/purchase",
          permissions: ['view purchases'],
        },
        {
          title: "Create Purchase",
          url: "/purchase/create",
          permissions: ['create purchases'],
        },
        {
          title: "Purchase Return",
          url: "/purchase-return",
          permissions: ['view purchase returns', 'create purchase returns'],
        },
        {
          title: "Sales List",
          url: "/sales",
          permissions: ['view sales'],
        },
        {
          title: "Create Sales",
          url: "/sales/create",
          permissions: ['create sales'],
        },
        {
          title: "Sales Return",
          url: "/sales-return",
          permissions: ['view returns', 'create returns'],
        },
        {
          title: "Cheque Clearing",
          url: "/clearing-cheque",
          permissions: ['manage cheques'],
        },
        {
          title: "Journal Voucher",
          url: "/journal-vouchers",
          permissions: ['view_journal_vouchers', 'view jv'],
        },
      ],
    },
    {
      title: "Investor Management",
      url: "#",
      icon: BookKey,
      permissions: ['manage roles'],
      items: [
        {
          title: "Investors",
          url: "/admin/investors",
          permissions: ['manage roles'],
        },
        {
          title: "Profit Distribution",
          url: "/admin/profit/distribute",
          permissions: ['manage roles'],
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: BookOpen,
      permissions: ['view reports', 'view profit reports'],
      items: [
        {
          title: "Accounts Report",
          url: "/reports/accounts/ledger",
          permissions: ['view reports'],
        },
        {
          title: "Audit",
          url: "/reports/audit",
          permissions: ['view reports'],
        },
        {
          title: "Profit Reports",
          url: "/reports/profit",
          permissions: ['view profit reports'],
        },
        {
          title: "Purchase Reports",
          url: "/reports/purchase",
          permissions: ['view reports'],
        },
        {
          title: "Purchase Return Reports",
          url: "/reports/purchase-return",
          permissions: ['view reports'],
        },
        {
          title: "Sales Reports",
          url: "/reports/sales",
          permissions: ['view reports'],
        },
        {
          title: "Sales Return Reports",
          url: "/reports/sales-return",
          permissions: ['view reports'],
        },
        {
          title: "Sales Map Report",
          url: "/reports/sales-map",
          permissions: ['view reports'],
        },
        {
          title: "Stock Reports",
          url: "/reports/stock",
          permissions: ['view reports'],
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: Settings2,
      permissions: ['view purchases', 'create purchases'],
      items: [
        {
          title: "Supplier Orders List",
          url: "/admin/supplier-order/list",
          permissions: ['view purchases'],
        },
        {
          title: "Create Supplier Order",
          url: "/admin/supplier-order",
          permissions: ['create purchases'],
        },
        {
          title: "Supplier Companies",
          url: "/admin/supplier-companies",
          permissions: ['view purchases'],
        },
      ],
    },
    {
      title: "Setting",
      url: "#",
      icon: Settings2,
      permissions: ['manage permissions', 'manage roles'],
      items: [
        {
          title: "Country",
          url: "/countries",
          permissions: ['manage permissions', 'manage roles'],
        },
        {
          title: "States",
          url: "/provinces",
          permissions: ['manage permissions', 'manage roles'],
        },
        {
          title: "Cites",
          url: "/cities",
          permissions: ['view cities', 'manage permissions', 'manage roles'],
        },
        {
          title: "Email Configuration",
          url: "/admin/settings/email",
          permissions: ['manage permissions', 'manage roles'],
        },
        {
          title: "System Configuration",
          url: "/admin/settings/configuration",
          permissions: ['manage permissions', 'manage roles'],
        },
        {
          title: "Email Templates",
          url: "/admin/settings/templates",
          permissions: ['manage permissions', 'manage roles'],
        },
      ],
    },
    {
      title: "Administration",
      url: "#",
      icon: Users,
      permissions: ['manage staff', 'manage roles', 'manage permissions'],
      items: [
        {
          title: "Staff",
          url: "/staff",
          permissions: ['manage staff'],
        },
        {
          title: "Shifts",
          url: "/admin/shifts",
          permissions: ['manage staff'],
        },
        {
          title: "Roles & Permission",
          url: "/roles/permissions",
          permissions: ['manage roles', 'manage permissions'],
        },
        {
          title: "Activity Logs",
          url: "/admin/activity-logs",
          permissions: ['manage roles'],
        },
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
