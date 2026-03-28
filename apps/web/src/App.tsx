import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPage } from "@/features/dashboard";
import { ProjectsPage } from "@/features/projects";
import { ImportDetailPage, ImportsPage } from "@/features/imports";
import NewImportPage from "@/app/imports/NewImportPage";

/**
 * Application router.
 *
 * Route tree:
 *   /                    → redirect to /projects
 *   /dashboard           → DashboardPage (placeholder)
 *   /projects            → ProjectsPage  (fully implemented)
 *   /imports             → ImportsPage   (imports list)
 *   /imports/:id         → ImportDetailPage
 *   /imports/new         → NewImportPage (wizard upload step)
 *
 * All routes share DashboardLayout (Sidebar + Topbar + Outlet).
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      // Default route — redirect to the projects list.
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "imports", element: <ImportsPage /> },
      { path: "imports/:id", element: <ImportDetailPage /> },
      { path: "imports/new", element: <NewImportPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
