import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { Loading, Empty, ErrorBox, PageHeader, DemoBadge } from "@/components/ui-states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/formations")({
  head: () => ({ meta: [{ title: "Formations — UNTRTCI" }, { name: "description", content: "Formations proposées par l'UNTRTCI." }, { property: "og:title", content: "Formations — UNTRTCI" }, { property: "og:description", content: "Inscrivez-vous aux formations." }] }),
  component: Formations,
});

function Formations() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["trainings"],
    queryFn: async () => {
      const [{ data, error }, regs] = await Promise.all([
        supabase.from("trainings").select("*").order("starts_at"),
        supabase.from("training_registrations").select("training_id").eq("user_id", user.id),
      ]);
      if (error) throw error;
      const mine = new Set((regs.data ?? []).map((r) => r.training_id));
      return data.map((t) => ({ ...t, registered: mine.has(t.id) }));
    },
  });
  async function toggle(id: string, registered: boolean) {
    if (registered && !confirm("Annuler votre inscription ?")) return;
    const { error } = registered
      ? await supabase.from("training_registrations").delete().eq("training_id", id).eq("user_id", user.id)
      : await supabase.from("training_registrations").insert({ training_id: id, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success(registered ? "Inscription annulée" : "Inscription confirmée");
    qc.invalidateQueries({ queryKey: ["trainings"] });
  }
  return (
    <div>
      <PageHeader title="Formations" subtitle="Renforcez vos compétences" />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : q.data!.length === 0 ? <Empty text="Aucune formation programmée." /> : (
        <ul className="space-y-3">
          {q.data!.map((t) => (
            <li key={t.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2"><p className="flex-1 font-semibold">{t.title}</p><DemoBadge show={t.is_demo} /></div>
              <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(t.starts_at)}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.location}</span>
                {t.seats && <span>{t.seats} places</span>}
              </p>
              {t.description && <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>}
              <Button size="sm" className="mt-3" variant={t.registered ? "outline" : "default"} onClick={() => toggle(t.id, t.registered)}>
                {t.registered ? "Inscrit · annuler" : "S'inscrire"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
