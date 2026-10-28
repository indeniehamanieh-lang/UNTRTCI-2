import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, fmtDate } from "@/lib/session";
import { Loading, Empty, ErrorBox } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type Membership = Database["public"]["Tables"]["memberships"]["Row"];
type Status = Database["public"]["Enums"]["membership_status"];

export const Route = createFileRoute("/_authenticated/admin/adherents")({
  beforeLoad: ({ context }) => { if (!context.isManager) throw redirect({ to: "/admin" }); },
  component: Adherents,
});

const FILTERS: { v: Status | "all"; label: string }[] = [
  { v: "en_attente", label: "En attente" }, { v: "validee", label: "Validés" }, { v: "refusee", label: "Refusés" },
  { v: "suspendue", label: "Suspendus" }, { v: "expiree", label: "Expirés" }, { v: "all", label: "Tous" },
];

// Décisions possibles selon le statut actuel
const ACTIONS: Record<Status, { to: Status | "revoke"; label: string; variant?: "outline" | "destructive" }[]> = {
  en_attente: [{ to: "validee", label: "Valider" }, { to: "refusee", label: "Refuser", variant: "destructive" }],
  validee: [{ to: "suspendue", label: "Suspendre", variant: "outline" }, { to: "revoke", label: "Révoquer la carte", variant: "destructive" }],
  refusee: [{ to: "validee", label: "Valider finalement" }],
  suspendue: [{ to: "validee", label: "Réactiver" }, { to: "refusee", label: "Refuser", variant: "destructive" }],
  expiree: [{ to: "validee", label: "Renouveler (1 an)" }],
};

function Photo({ path }: { path: string | null }) {
  const q = useQuery({
    queryKey: ["photo", path],
    enabled: !!path,
    queryFn: async () => (await supabase.storage.from("member-photos").createSignedUrl(path!, 3600)).data?.signedUrl ?? null,
  });
  return q.data ? <img src={q.data} alt="" className="h-16 w-12 rounded-md object-cover" /> : <div className="h-16 w-12 rounded-md bg-muted" />;
}

function IdentityViewer({ m }: { m: Membership }) {
  const qc = useQueryClient();
  const [urls, setUrls] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  async function show() {
    setBusy(true);
    try {
      const log = await supabase.rpc("log_identity_view", { _id: m.id });
      if (log.error) throw log.error;
      const paths = [m.id_front_path, m.id_back_path].filter((x): x is string => !!x);
      const out: string[] = [];
      for (const p of paths) {
        const r = await supabase.storage.from("member-documents").createSignedUrl(p, 120);
        if (r.error || !r.data) throw r.error ?? new Error("Pièce introuvable");
        out.push(r.data.signedUrl);
      }
      setUrls(out);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    setBusy(false);
  }
  async function purge() {
    if (!window.confirm("Supprimer définitivement les images de la pièce d'identité ? La mention « vérifiée » est conservée.")) return;
    setBusy(true);
    try {
      const paths = [m.id_front_path, m.id_back_path].filter((x): x is string => !!x);
      const rm = await supabase.storage.from("member-documents").remove(paths);
      if (rm.error) throw rm.error;
      const r = await supabase.rpc("purge_identity", { _id: m.id });
      if (r.error) throw r.error;
      setUrls(null);
      toast.success("Pièce supprimée");
      qc.invalidateQueries({ queryKey: ["admin-memberships"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    setBusy(false);
  }
  if (!m.id_front_path) {
    return <p className="mt-2 text-xs text-muted-foreground">{m.id_verified ? "Pièce d'identité vérifiée (images supprimées)." : "⚠ Aucune pièce d'identité fournie."}</p>;
  }
  return (
    <div className="mt-2 space-y-2">
      {urls ? (
        <div className="space-y-2">
          {urls.map((u) => <img key={u} src={u} alt="Pièce d'identité" className="w-full rounded-lg border" />)}
          <Button size="sm" variant="ghost" onClick={() => setUrls(null)}>Masquer</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={show} disabled={busy}>{busy ? "…" : "Voir la pièce d'identité"}</Button>
      )}
      {m.id_verified && <Button size="sm" variant="outline" onClick={purge} disabled={busy}>Supprimer les images (déjà vérifiée)</Button>}
    </div>
  );
}

function Adherents() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("en_attente");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ id: string; to: Status | "revoke" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["admin-memberships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("memberships").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Membership[];
    },
  });

  async function confirm() {
    if (!pending) return;
    if ((pending.to === "refusee" || pending.to === "suspendue" || pending.to === "revoke") && note.trim().length < 3) {
      toast.error("Indiquez un motif (3 caractères minimum).");
      return;
    }
    setBusy(true);
    const n = note.trim() || undefined;
    const { error } = pending.to === "revoke"
      ? await supabase.rpc("revoke_card", { _id: pending.id, _note: n })
      : await supabase.rpc("review_membership", { _id: pending.id, _status: pending.to, _note: n });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Décision enregistrée");
    setPending(null); setNote("");
    qc.invalidateQueries({ queryKey: ["admin-memberships"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const s = search.trim().toLowerCase();
  const list = (q.data ?? []).filter((m) =>
    (filter === "all" || m.status === filter) &&
    (!s || `${m.nom} ${m.prenoms} ${m.ville} ${m.telephone} ${m.member_number ?? ""}`.toLowerCase().includes(s)));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${filter === f.v ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
            {f.label}{q.data ? ` (${f.v === "all" ? q.data.length : q.data.filter((m) => m.status === f.v).length})` : ""}
          </button>
        ))}
      </div>
      <Input placeholder="Rechercher (nom, ville, téléphone, n° de membre)" value={search} onChange={(e) => setSearch(e.target.value)} />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : list.length === 0 ? <Empty text="Aucun dossier." /> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((m) => (
            <li key={m.id} className="rounded-xl border bg-card p-4">
              <div className="flex gap-3">
                <Photo path={m.photo_url} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.prenoms} {m.nom}</p>
                  <p className="text-xs text-muted-foreground">{m.ville} · {m.telephone}</p>
                  <p className="text-xs text-muted-foreground">Demande du {fmtDate(m.created_at)}{m.member_number ? ` · N° ${m.member_number}` : ""}</p>
                </div>
                <span className="h-fit rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">{STATUS_LABEL[m.status]}{m.card_revoked ? " · carte révoquée" : ""}</span>
              </div>
              {m.specialites.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{m.specialites.map((x) => <span key={x} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{x}</span>)}</div>}
              <IdentityViewer m={m} />
              {m.review_note && <p className="mt-2 text-xs text-muted-foreground">Note : {m.review_note}</p>}
              {pending?.id === m.id ? (
                <div className="mt-3 space-y-2">
                  <Textarea rows={2} maxLength={300} placeholder="Motif ou note (obligatoire pour refuser, suspendre ou révoquer)" value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={confirm} disabled={busy}>{busy ? "…" : "Confirmer"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setPending(null); setNote(""); }}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACTIONS[m.status].map((a) => (
                    <Button key={a.label} size="sm" variant={a.variant ?? "default"} onClick={() => { setPending({ id: m.id, to: a.to }); setNote(""); }}>{a.label}</Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
