import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FolderOpen,
  Upload,
  Table2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { cn } from "@/utils/cn";

interface NavItem {
  label: string;
  to: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", Icon: LayoutGrid },
  { label: "Projects", to: "/projects", Icon: FolderOpen },
  { label: "Imports", to: "/imports", Icon: Upload },
];

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "h-14 flex items-center gap-2.5 px-4 border border-sidebar-border",
        collapsed && "justify-center px-0",
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
        <Table2 className="w-4 h-4 text-white" strokeWidth={2} />
      </div>

      {!collapsed && (
        <span className="text-white font-semibold text-base tracking-tight leading-none select-none">
          Schemify
        </span>
      )}
    </div>
  );
}

// ─── Single nav item ──────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors duration-150",
          "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-hover",
          isActive && "bg-sidebar-active !text-sidebar-text-active",
          collapsed && "justify-center px-0 mx-2",
        )
      }
    >
      <item.Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />

      {!collapsed && (
        <span className="text-sm font-medium leading-none">{item.label}</span>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const collapsed = !sidebarOpen;

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar-bg shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden",
        sidebarOpen ? "w-sidebar" : "w-sidebar-collapsed",
      )}
    >
      <Logo collapsed={collapsed} />

      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "flex items-center gap-2 m-2 px-3 py-2.5 rounded-lg",
          "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-hover",
          "transition-colors duration-150",
          collapsed && "justify-center px-0",
        )}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? (
          <>
            <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span className="text-xs font-medium leading-none">Collapse</span>
          </>
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2} />
        )}
      </button>
    </aside>
  );
}
