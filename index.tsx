import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ChevronRight, GraduationCap, LifeBuoy, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { Loading, ErrorBox } from "@/components/ui-states";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

type Stats = { pending: number; validated: number; refused: number; suspended: number; users: number; open_support: number; training_regs: number; applications: number };
type Lite = { id: string; nom: string; prenoms: string; ville: string; status: string; created_at: string };

function lastMonths(n: number) {
  const out: { key: string; label: string; count: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""), count: 0 });
  }
  return out;
}

function Dashboard() {
  const { isManager } = Route.useRouteContext();
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as unknown as Stats | null;
    },
  });
  const members = useQuery({
    queryKey: ["admin-memberships", "lite"],
    enabled: isManager,
    queryFn: async () => {
      const { data, error } = await supabase.from("memberships").select("id,nom,prenoms,ville,status,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lite[];
    },
  });

  if (stats.isLoading) return <Loading />;
  if (stats.error) return <ErrorBox error={stats.error} />;
  const s = stats.data;
  if (!s) return <ErrorBox error={new Error("Statistiques indisponibles.")} />;

  const months = lastMonths(6);
  let thisMonth = 0;
  for (const m of members.data ?? []) {
    const d = new Date(m.created_at);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const b = months.find((x) => x.key === k);
    if (b) b.count += 1;
  }
  thisMonth = months[months.length - 1]?.count ?? 0;
  const max = Math.max(1, ...months.map((m) => m.count));
  const pendingList = (members.data ?? []).filter((m) => m.status === "en_attente").slice(0, 3);

  const cards = [
    { label: "Adhérents validés", v: s.validated, icon: Users, to: "/admin/adherents" },
    ...(isManager ? [{ label: "Demandes ce mois-ci", v: thisMonth, icon: UserPlus, to: "/admin/adherents" }] : []),
    { label: "Assistance ouverte", v: s.open_support, icon: LifeBuoy, to: "/admin/support" },
    { label: "Inscriptions formations", v: s.training_regs, icon: GraduationCap, to: "/admin/inscriptions" },
    { label: "Candidatures", v: s.applications, icon: Briefcase, to: "/admin/inscriptions" },
    { label: "Comptes créés", v: s.users, icon: Users, to: "/admin/adherents" },
  ] as const;

  return (
    <div className="space-y-5">
      {isManager ? (
        <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-soft">
          <p className="text-xs uppercase tracking-wider opacity-80">À traiter</p>
          <p className="mt-1 text-4xl font-extrabold leading-none">{s.pending}<span className="ml-2 text-base font-normal opacity-90">demande{s.pending > 1 ? "s" : ""} d'adhésion</span></p>
          <Link to="/admin/adherents" className="mt-4 inline-flex items-center gap-1 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary-deep">
            Examiner les demandes <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-soft">
          <p className="text-xs uppercase tracking-wider opacity-80">Gestion</p>
          <p className="mt-1 text-xl font-bold">Publiez les actualités, événements, formations et offres.</p>
          <Link to="/admin/contenus" className="mt-4 inline-flex items-center gap-1 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary-deep">
            Gérer les contenus <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs">{c.label}</span><c.icon className="h-4 w-4" /></div>
            <p className="mt-2 text-2xl font-bold">{c.v}</p>
          </Link>
        ))}
      </div>

      {isManager && (
        <section className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Demandes d'adhésion par mois</p>
          <div className="mt-3 flex h-28 items-end gap-2">
            {months.map((m, i) => (
              <div key={m.key} className="flex flex-1 flex-col items-center justify-end">
                <span className="text-[11px] text-muted-foreground">{m.count}</span>
                <div className={`mt-1 w-full rounded-md ${i === months.length - 1 ? "bg-primary" : "bg-secondary"}`} style={{ height: `${Math.max(4, Math.round((m.count / max) * 64))}px` }} />
                <span className="mt-1 text-[11px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {isManager && pendingList.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-semibold">Dernières demandes</p>
          <ul className="space-y-2">
            {pendingList.map((m) => (
              <li key={m.id}>
                <Link to="/admin/adherents" className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">{(m.prenoms[0] ?? "") + (m.nom[0] ?? "")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{m.prenoms} {m.nom}</span>
                    <span className="block text-xs text-muted-foreground">{m.ville} · {fmtDate(m.created_at)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
