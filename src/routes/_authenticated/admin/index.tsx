import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loading, ErrorBox } from "@/components/ui-states";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

type Stats = { pending: number; validated: number; refused: number; suspended: number; users: number; open_support: number; training_regs: number; applications: number };

function Dashboard() {
  const { isManager } = Route.useRouteContext();
  const q = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as unknown as Stats | null;
    },
  });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const s = q.data;
  if (!s) return <ErrorBox error={new Error("Statistiques indisponibles.")} />;
  const cards = [
    { label: "Demandes en attente", v: s.pending, to: "/admin/adherents", strong: true },
    { label: "Membres validés", v: s.validated },
    { label: "Dossiers refusés", v: s.refused },
    { label: "Adhésions suspendues", v: s.suspended },
    { label: "Comptes créés", v: s.users },
    { label: "Demandes d'assistance ouvertes", v: s.open_support, to: "/admin/support" },
    { label: "Inscriptions aux formations", v: s.training_regs },
    { label: "Candidatures", v: s.applications },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => {
        const body = (
          <div className={`rounded-xl border p-4 ${"strong" in c && c.strong ? "bg-hero text-primary-foreground" : "bg-card"}`}>
            <p className="text-3xl font-extrabold">{c.v}</p>
            <p className="mt-1 text-xs opacity-80">{c.label}</p>
          </div>
        );
        return "to" in c && c.to && isManager ? <Link key={c.label} to={c.to}>{body}</Link> : <div key={c.label}>{body}</div>;
      })}
    </div>
  );
}
