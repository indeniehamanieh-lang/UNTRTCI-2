import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { Loading, Empty, ErrorBox } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/alertes")({ component: Alertes });

function Alertes() {
  const { isManager } = Route.useRouteContext();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["admin-broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").is("user_id", null).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim(), b = body.trim();
    if (t.length < 3 || t.length > 120) { toast.error("Titre : 3 à 120 caractères"); return; }
    if (b.length < 3 || b.length > 1000) { toast.error("Message : 3 à 1000 caractères"); return; }
    if (!window.confirm("Envoyer cette alerte à tous les membres ?")) return;
    setBusy(true);
    const { error } = await supabase.from("notifications").insert({ title: t, body: b, user_id: null });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Alerte envoyée à tous les membres");
    setTitle(""); setBody("");
    qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function remove(id: string) {
    if (!window.confirm("Supprimer cette alerte ?")) return;
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  return (
    <div className="space-y-5">
      <form onSubmit={send} className="space-y-3 rounded-xl border bg-card p-4">
        <p className="font-semibold">Nouvelle alerte pour tous les membres</p>
        <div className="space-y-1.5"><Label>Titre</Label><Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Message</Label><Textarea rows={4} value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} /></div>
        <Button disabled={busy}>{busy ? "Envoi…" : "Envoyer"}</Button>
      </form>
      <section>
        <h2 className="mb-2 font-bold">Alertes envoyées</h2>
        {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : q.data!.length === 0 ? <Empty text="Aucune alerte envoyée." /> : (
          <ul className="space-y-2">
            {q.data!.map((n) => (
              <li key={n.id} className="flex gap-2 rounded-xl border bg-card p-3">
                <div className="flex-1"><p className="font-semibold">{n.title}</p><p className="text-sm text-muted-foreground">{n.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{fmtDate(n.created_at)}</p></div>
                {isManager && <Button size="icon" variant="outline" aria-label="Supprimer" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
