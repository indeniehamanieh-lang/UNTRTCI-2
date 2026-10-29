import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { Loading, Empty, ErrorBox, PageHeader, DemoBadge } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/offres")({
  head: () => ({ meta: [{ title: "Emplois et missions — UNTRTCI" }, { name: "description", content: "Offres d'emploi et missions audiovisuelles." }, { property: "og:title", content: "Emplois et missions — UNTRTCI" }, { property: "og:description", content: "Offres pour techniciens." }] }),
  component: Offres,
});

function Offres() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const q = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const [{ data, error }, apps] = await Promise.all([
        supabase.from("jobs").select("*").order("created_at", { ascending: false }),
        supabase.from("job_applications").select("job_id").eq("user_id", user.id),
      ]);
      if (error) throw error;
      const mine = new Set((apps.data ?? []).map((a) => a.job_id));
      return data.map((j) => ({ ...j, applied: mine.has(j.id) }));
    },
  });
  async function apply(id: string) {
    const { error } = await supabase.from("job_applications").insert({ job_id: id, user_id: user.id, message: msg.trim().slice(0, 1000) || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Candidature envoyée");
    setOpen(null); setMsg("");
    qc.invalidateQueries({ queryKey: ["jobs"] });
  }
  return (
    <div>
      <PageHeader title="Emplois et missions" />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : q.data!.length === 0 ? <Empty text="Aucune offre pour le moment." /> : (
        <ul className="space-y-3">
          {q.data!.map((j) => (
            <li key={j.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">{j.kind}</span>
                <span className="text-xs text-muted-foreground">{j.location}</span><DemoBadge show={j.is_demo} />
              </div>
              <p className="mt-1 font-semibold">{j.title}</p>
              {j.description && <p className="text-sm text-muted-foreground">{j.description}</p>}
              {j.closes_at && <p className="mt-1 text-xs text-muted-foreground">Clôture : {fmtDate(j.closes_at)}</p>}
              {j.closes_at && new Date(j.closes_at) < new Date() ? <p className="mt-3 text-sm font-medium text-muted-foreground">Offre clôturée</p> : j.applied ? <p className="mt-3 text-sm font-medium text-success">Candidature envoyée ✓</p> : open === j.id ? (
                <div className="mt-3 space-y-2">
                  <Textarea placeholder="Message (facultatif)" maxLength={1000} value={msg} onChange={(e) => setMsg(e.target.value)} />
                  <div className="flex gap-2"><Button size="sm" onClick={() => apply(j.id)}>Envoyer</Button><Button size="sm" variant="ghost" onClick={() => setOpen(null)}>Annuler</Button></div>
                </div>
              ) : <Button size="sm" className="mt-3" onClick={() => setOpen(j.id)}>Postuler</Button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
