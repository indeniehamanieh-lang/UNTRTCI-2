import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { selectClass } from "@/lib/admin-utils";
import { Loading, Empty, ErrorBox } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type Req = Database["public"]["Tables"]["support_requests"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/support")({
  beforeLoad: ({ context }) => { if (!context.isManager) throw redirect({ to: "/admin" }); },
  component: Support,
});

function Item({ r, name }: { r: Req; name: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(r.status);
  const [response, setResponse] = useState(r.response ?? "");
  const [busy, setBusy] = useState(false);
  async function save() {
    const text = response.trim();
    if (text.length > 2000) { toast.error("Réponse trop longue (2000 caractères max)"); return; }
    setBusy(true);
    const { error } = await supabase.from("support_requests").update({ status, response: text || null }).eq("id", r.id);
    if (!error && text && text !== (r.response ?? "")) {
      await supabase.from("notifications").insert({ user_id: r.user_id, title: "Réponse à votre demande", body: `Votre demande « ${r.subject.slice(0, 60)} » a reçu une réponse. Consultez la rubrique Assistance.` });
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Enregistré");
    qc.invalidateQueries({ queryKey: ["admin-support"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }
  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex justify-between text-xs text-muted-foreground"><span>{r.kind} · {fmtDate(r.created_at)}</span><span>{name}</span></div>
      <p className="mt-1 font-semibold">{r.subject}</p>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{r.message}</p>
      <div className="mt-3 space-y-2">
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ouverte">Ouverte</option><option value="en_cours">En cours</option><option value="fermee">Fermée</option>
        </select>
        <Textarea rows={3} maxLength={2000} placeholder="Votre réponse au membre" value={response} onChange={(e) => setResponse(e.target.value)} />
        <Button size="sm" onClick={save} disabled={busy}>{busy ? "…" : "Enregistrer"}</Button>
      </div>
    </li>
  );
}

function Support() {
  const [filter, setFilter] = useState<"open" | "all">("open");
  const q = useQuery({
    queryKey: ["admin-support"],
    queryFn: async () => {
      const [reqs, members] = await Promise.all([
        supabase.from("support_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("memberships").select("user_id,nom,prenoms"),
      ]);
      if (reqs.error) throw reqs.error;
      const names = new Map((members.data ?? []).map((m) => [m.user_id, `${m.prenoms} ${m.nom}`]));
      return reqs.data.map((r) => ({ r, name: names.get(r.user_id) ?? "Membre sans dossier" }));
    },
  });
  const list = (q.data ?? []).filter((x) => filter === "all" || x.r.status !== "fermee");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([["open", "À traiter"], ["all", "Toutes"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`rounded-full border px-3 py-1 text-xs ${filter === v ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{l}</button>
        ))}
      </div>
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : list.length === 0 ? <Empty text="Aucune demande." /> : (
        <ul className="grid gap-3 md:grid-cols-2">{list.map((x) => <Item key={`${x.r.id}-${x.r.status}-${x.r.response ?? ""}`} r={x.r} name={x.name} />)}</ul>
      )}
    </div>
  );
}
