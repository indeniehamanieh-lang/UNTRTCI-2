import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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

function AdminLayout() {
  const { isManager, isSuper } = Route.useRouteContext();
  const items = [
    { to: "/admin", label: "Tableau de bord", show: true },
    { to: "/admin/adherents", label: "Adhérents", show: isManager },
    { to: "/admin/inscriptions", label: "Inscriptions", show: isManager },
    { to: "/admin/contenus", label: "Contenus", show: true },
    { to: "/admin/alertes", label: "Alertes", show: true },
    { to: "/admin/support", label: "Assistance", show: isManager },
    { to: "/admin/equipe", label: "Équipe", show: isSuper },
  ] as const;
  const base = "shrink-0 rounded-full border px-3 py-1.5 text-sm";
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/profil" className="rounded-lg border p-2" aria-label="Retour"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-xl font-bold">Back-office</h1>
      </div>
      <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {items.filter((i) => i.show).map((i) => (
          <Link key={i.to} to={i.to} activeOptions={{ exact: true }}
            className={`${base} bg-card`}
            activeProps={{ className: `${base} border-primary bg-primary text-primary-foreground` }}>
            {i.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
