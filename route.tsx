import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Bell, FileText, LayoutDashboard, MoreHorizontal, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id);
    if (error) throw redirect({ to: "/accueil" });
    const roles = (data ?? []).map((r) => r.role);
    if (!roles.some((r) => r !== "membre")) throw redirect({ to: "/accueil" });
    return {
      isManager: roles.includes("super_admin") || roles.includes("responsable"),
      isSuper: roles.includes("super_admin"),
    };
  },
  head: () => ({ meta: [{ title: "Back-office — UNTRTCI" }] }),
  component: AdminLayout,
});

const TITLES: [string, string][] = [
  ["/admin/adherents", "Adhérents"],
  ["/admin/inscriptions", "Inscriptions"],
  ["/admin/contenus", "Contenus"],
  ["/admin/alertes", "Alertes"],
  ["/admin/support", "Assistance"],
  ["/admin/equipe", "Équipe"],
  ["/admin/plus", "Plus"],
];

function AdminLayout() {
  const { isManager } = Route.useRouteContext();
  const path = useLocation().pathname.replace(/\/$/, "");
  const title = TITLES.find(([p]) => path.startsWith(p))?.[1] ?? "Tableau de bord";
  const morePaths = ["/admin/plus", "/admin/inscriptions", "/admin/support", "/admin/equipe"];
  const tabs = [
    { to: "/admin", label: "Accueil", icon: LayoutDashboard, show: true, active: path === "/admin" },
    { to: "/admin/adherents", label: "Adhérents", icon: Users, show: isManager, active: path.startsWith("/admin/adherents") },
    { to: "/admin/contenus", label: "Contenus", icon: FileText, show: true, active: path.startsWith("/admin/contenus") },
    { to: "/admin/alertes", label: "Alertes", icon: Bell, show: true, active: path.startsWith("/admin/alertes") },
    { to: "/admin/plus", label: "Plus", icon: MoreHorizontal, show: true, active: morePaths.some((p) => path.startsWith(p)) },
  ] as const;
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Link to="/accueil" className="rounded-xl bg-card p-2.5 shadow-sm" aria-label="Retour à l'application"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Back-office UNTRTCI</p>
          <h1 className="text-xl font-bold leading-tight">{title}</h1>
        </div>
      </div>
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
        <ul className="mx-auto flex max-w-2xl justify-around pb-[env(safe-area-inset-bottom)]">
          {tabs.filter((t) => t.show).map((t) => (
            <li key={t.to}>
              <Link to={t.to} className={`flex flex-col items-center gap-0.5 px-3 py-2.5 text-[11px] ${t.active ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                <span className={`rounded-full px-4 py-1 ${t.active ? "bg-secondary" : ""}`}><t.icon className="h-5 w-5" /></span>
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
