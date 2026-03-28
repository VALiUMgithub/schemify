import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * Root shell that wraps every authenticated page.
 *
 * Structure:
 *   ┌──────────┬─────────────────────────────────┐
 *   │          │  Topbar (sticky, outside scroll)│
 *   │ Sidebar  ├─────────────────────────────────┤
 *   │          │  <Outlet /> (scrollable)        │
 *   └──────────┴─────────────────────────────────┘
 */
export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-surface-muted app-grid-background overflow-hidden">
      {/* Left panel */}
      <Sidebar />

      {/* Right panel — topbar + scrollable page area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
