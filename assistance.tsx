import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { Loading, Empty, PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/assistance")({
  head: () => ({ meta: [{ title: "Assistance — UNTRTCI" }, { name: "description", content: "Demandes d'assistance et réclamations confidentielles." }, { property: "og:title", content: "Assistance — UNTRTCI" }, { property: "og:description", content: "Contactez l'Union." }] }),
  component: Assistance,
});

const schema = z.object({
  subject: z.string().trim().min(3, "Objet trop court").max(150),
  message: z.string().trim().min(5, "Message trop court").max(3000),
});
const STATUS: Record<string, string> = { ouverte: "Ouverte", en_cours: "En cours", fermee: "Fermée" };

function Assistance() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [kind, setKind] = useState<"assistance" | "reclamation">("assistance");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["support", user.id],
    queryFn: async () => (await supabase.from("support_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = schema.safeParse({ subject, message });
    if (!v.success) { toast.error(v.error.issues[0]?.message ?? "Données invalides"); return; }
    setBusy(true);
    const { error } = await supabase.from("support_requests").insert({ ...v.data, kind, user_id: user.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Demande envoyée");
    setSubject(""); setMessage("");
    qc.invalidateQueries({ queryKey: ["support"] });
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Assistance" subtitle="Vos demandes restent confidentielles" />
      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-4">
        <div className="grid grid-cols-2 gap-2">
          {(["assistance", "reclamation"] as const).map((k) => (
            <button type="button" key={k} onClick={() => setKind(k)} className={`rounded-lg border py-2 text-sm ${kind === k ? "border-primary bg-primary text-primary-foreground" : ""}`}>
              {k === "assistance" ? "Assistance" : "Réclamation"}
            </button>
          ))}
        </div>
        <div className="space-y-1.5"><Label>Objet</Label><Input value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Message</Label><Textarea rows={5} value={message} maxLength={3000} onChange={(e) => setMessage(e.target.value)} /></div>
        <Button className="w-full" disabled={busy}>Envoyer</Button>
      </form>
      <section>
        <h2 className="mb-2 font-bold">Mes demandes</h2>
        {q.isLoading ? <Loading /> : q.data!.length === 0 ? <Empty text="Aucune demande." /> : (
          <ul className="space-y-2">
            {q.data!.map((r) => (
              <li key={r.id} className="rounded-xl border bg-card p-4">
                <div className="flex justify-between text-xs text-muted-foreground"><span>{r.kind} · {fmtDate(r.created_at)}</span><span className="font-semibold">{STATUS[r.status]}</span></div>
                <p className="mt-1 font-semibold">{r.subject}</p>
                <p className="text-sm text-muted-foreground">{r.message}</p>
                {r.response && <p className="mt-2 rounded-lg bg-secondary p-2 text-sm">Réponse : {r.response}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
