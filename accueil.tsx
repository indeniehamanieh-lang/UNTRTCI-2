import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Briefcase, FileText, LifeBuoy, ClipboardList, ShieldCheck, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.json";
import { supabase } from "@/integrations/supabase/client";
import { useMembership, useRoles, STATUS_LABEL, fmtDate } from "@/lib/session";
import { Loading, Empty, ErrorBox, DemoBadge } from "@/components/ui-states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/accueil")({
  head: () => ({ meta: [{ title: "Accueil — UNTRTCI Mobile" }, { name: "description", content: "Actualités, annonces et événements de l'UNTRTCI." }, { property: "og:title", content: "Accueil — UNTRTCI" }, { property: "og:description", content: "Actualités de l'Union." }] }),
  component: Accueil,
});

function Accueil() {
  const { user } = Route.useRouteContext();
  const m = useMembership(user.id);
  const roles = useRoles(user.id);
  const qc = useQueryClient();
  const news = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });
  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const [{ data, error }, regs] = await Promise.all([
        supabase.from("events").select("*").gte("starts_at", new Date().toISOString()).order("starts_at"),
        supabase.from("event_registrations").select("event_id").eq("user_id", user.id),
      ]);
      if (error) throw error;
      const mine = new Set((regs.data ?? []).map((r) => r.event_id));
      return data.map((e) => ({ ...e, registered: mine.has(e.id) }));
    },
  });

  async function toggleEvent(id: string, registered: boolean) {
    const { error } = registered
      ? await supabase.from("event_registrations").delete().eq("event_id", id).eq("user_id", user.id)
      : await supabase.from("event_registrations").insert({ event_id: id, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success(registered ? "Inscription annulée" : "Inscription confirmée");
    qc.invalidateQueries({ queryKey: ["events"] });
  }

  const quick = [
    { to: "/carte", label: "Adhésion", icon: BadgeCheck },
    { to: "/adhesion", label: "Mon dossier", icon: ClipboardList },
    { to: "/offres", label: "Offres", icon: Briefcase },
    { to: "/documents", label: "Documents", icon: FileText },
    { to: "/assistance", label: "Assistance", icon: LifeBuoy },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <img src={logo.url} alt="UNTRTCI" className="h-10 w-auto rounded-md" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Bienvenue</p>
          <p className="font-display font-bold">UNTRTCI Mobile</p>
        </div>
        {roles.data?.isStaff && (
          <Button asChild size="sm" variant="outline"><Link to="/admin"><ShieldCheck className="h-4 w-4" />Admin</Link></Button>
        )}
      </div>

      <Link to={m.data?.status === "validee" ? "/carte" : "/adhesion"} className="block rounded-2xl bg-hero p-5 text-primary-foreground shadow-soft">
        <p className="text-xs uppercase tracking-wider opacity-80">Mon adhésion</p>
        <p className="mt-1 text-xl font-bold">
          {m.isLoading ? "…" : m.data ? STATUS_LABEL[m.data.status] : "Pas encore membre"}
        </p>
        <p className="mt-1 text-sm opacity-90">
          {m.data?.status === "validee" ? `N° ${m.data.member_number} · voir mon adhésion` : m.data ? "Voir le détail de ma demande" : "Faire ma demande →"}
        </p>
      </Link>

      <div className="grid grid-cols-5 gap-2">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} className="flex flex-col items-center gap-1 rounded-xl bg-card p-2 text-center text-[11px] font-medium shadow-sm">
            <span className="rounded-lg bg-secondary p-2 text-primary"><q.icon className="h-5 w-5" /></span>
            {q.label}
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-2 text-lg font-bold">Événements à venir</h2>
        {events.isLoading ? <Loading /> : events.error ? <ErrorBox error={events.error} /> : events.data!.length === 0 ? <Empty text="Aucun événement prévu." /> : (
          <ul className="space-y-2">
            {events.data!.map((e) => (
              <li key={e.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold" /><span className="text-xs text-muted-foreground">{fmtDate(e.starts_at)} · {e.location}</span><DemoBadge show={e.is_demo} /></div>
                <p className="mt-1 font-semibold">{e.title}</p>
                {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
                <Button size="sm" className="mt-3" variant={e.registered ? "outline" : "default"} onClick={() => toggleEvent(e.id, e.registered)}>
                  {e.registered ? "Annuler mon inscription" : "Je participe"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Actualités et communiqués</h2>
        {news.isLoading ? <Loading /> : news.error ? <ErrorBox error={news.error} /> : news.data!.length === 0 ? <Empty text="Aucune actualité pour le moment." /> : (
          <ul className="space-y-2">
            {news.data!.map((n) => (
              <li key={n.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground">{n.kind}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(n.created_at)}</span>
                  <DemoBadge show={n.is_demo} />
                </div>
                <p className="mt-1 font-semibold">{n.title}</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
