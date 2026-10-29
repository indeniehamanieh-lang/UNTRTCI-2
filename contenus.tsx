import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { fmtDate } from "@/lib/session";
import { table, toLocalInput, fromLocalInput, isHttpUrl, selectClass, type Row } from "@/lib/admin-utils";
import { Loading, Empty, ErrorBox, DemoBadge } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/contenus")({ component: Contenus });

type Field = {
  key: string; label: string;
  type: "text" | "textarea" | "datetime" | "select" | "number" | "url" | "bool";
  options?: { value: string; label: string }[];
  required?: boolean; nullable?: boolean; max?: number;
};
type Cfg = { name: string; label: string; fields: Field[]; sub: (r: Row) => string; order: string; asc?: boolean; defaults?: Record<string, string | boolean> };

const CFGS: Cfg[] = [
  { name: "news", label: "Actualités", order: "created_at", sub: (r) => `${String(r["kind"])} · ${fmtDate(r["created_at"] as string)}${r["published"] ? "" : " · brouillon"}`,
    defaults: { kind: "actualite", published: true },
    fields: [
      { key: "title", label: "Titre", type: "text", required: true, max: 150 },
      { key: "body", label: "Texte", type: "textarea", required: true, max: 5000 },
      { key: "kind", label: "Type", type: "select", options: [{ value: "actualite", label: "Actualité" }, { value: "annonce", label: "Annonce" }, { value: "communique", label: "Communiqué" }] },
      { key: "published", label: "Publié", type: "bool" },
    ] },
  { name: "events", label: "Événements", order: "starts_at", asc: true, sub: (r) => `${fmtDate(r["starts_at"] as string)} · ${String(r["location"] ?? "")}`,
    fields: [
      { key: "title", label: "Titre", type: "text", required: true, max: 150 },
      { key: "description", label: "Description", type: "textarea", max: 3000 },
      { key: "location", label: "Lieu", type: "text", max: 150 },
      { key: "starts_at", label: "Date et heure", type: "datetime", required: true },
    ] },
  { name: "trainings", label: "Formations", order: "starts_at", asc: true, sub: (r) => `${fmtDate(r["starts_at"] as string)} · ${String(r["location"] ?? "")}${r["seats"] ? ` · ${String(r["seats"])} places` : ""}`,
    fields: [
      { key: "title", label: "Titre", type: "text", required: true, max: 150 },
      { key: "description", label: "Description", type: "textarea", max: 3000 },
      { key: "location", label: "Lieu", type: "text", max: 150 },
      { key: "starts_at", label: "Date et heure", type: "datetime", required: true },
      { key: "seats", label: "Nombre de places (vide = illimité)", type: "number", nullable: true },
    ] },
  { name: "jobs", label: "Offres", order: "created_at", sub: (r) => `${String(r["kind"])} · ${String(r["location"] ?? "")}`,
    defaults: { kind: "mission" },
    fields: [
      { key: "title", label: "Titre", type: "text", required: true, max: 150 },
      { key: "description", label: "Description", type: "textarea", max: 3000 },
      { key: "location", label: "Lieu", type: "text", max: 150 },
      { key: "kind", label: "Type", type: "select", options: [{ value: "mission", label: "Mission" }, { value: "emploi", label: "Emploi" }] },
      { key: "contact", label: "Contact (facultatif)", type: "text", nullable: true, max: 150 },
      { key: "closes_at", label: "Date de clôture (facultatif)", type: "datetime", nullable: true },
    ] },
  { name: "documents", label: "Documents", order: "created_at", sub: (r) => String(r["category"] ?? ""),
    defaults: { category: "Général" },
    fields: [
      { key: "title", label: "Titre", type: "text", required: true, max: 150 },
      { key: "category", label: "Catégorie", type: "text", required: true, max: 60 },
      { key: "url", label: "Lien du document (https://…)", type: "url", required: true, max: 500 },
    ] },
];

type Form = Record<string, string | boolean>;

function Manager({ cfg, userId }: { cfg: Cfg; userId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>({});
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["admin-content", cfg.name],
    queryFn: async () => {
      const { data, error } = await table(cfg.name).select("*").order(cfg.order, { ascending: cfg.asc ?? false });
      if (error) throw error;
      return data as Row[];
    },
  });

  function open(row?: Row) {
    const f: Form = {};
    for (const fl of cfg.fields) {
      const raw = row ? row[fl.key] : cfg.defaults?.[fl.key];
      f[fl.key] = fl.type === "bool" ? raw === true : fl.type === "datetime" ? toLocalInput(raw) : raw == null ? "" : String(raw);
    }
    setForm(f);
    setEditing(row ? String(row["id"]) : "new");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: Row = {};
    for (const fl of cfg.fields) {
      const v = form[fl.key];
      if (fl.type === "bool") { payload[fl.key] = v === true; continue; }
      const t = String(v ?? "").trim();
      if (!t) {
        if (fl.required) { toast.error(`${fl.label} : champ obligatoire`); return; }
        payload[fl.key] = fl.nullable ? null : "";
        continue;
      }
      if (fl.max && t.length > fl.max) { toast.error(`${fl.label} : ${fl.max} caractères maximum`); return; }
      if (fl.type === "url" && !isHttpUrl(t)) { toast.error("Le lien doit commencer par http:// ou https://"); return; }
      if (fl.type === "number") {
        const n = Number(t);
        if (!Number.isInteger(n) || n < 1) { toast.error(`${fl.label} : nombre entier positif attendu`); return; }
        payload[fl.key] = n; continue;
      }
      if (fl.type === "datetime") {
        const iso = fromLocalInput(t);
        if (!iso) { toast.error(`${fl.label} : date invalide`); return; }
        payload[fl.key] = iso; continue;
      }
      payload[fl.key] = t;
    }
    setBusy(true);
    const t = table(cfg.name);
    const { error } = editing === "new"
      ? await t.insert(cfg.name === "news" ? { ...payload, author_id: userId } : payload)
      : await t.update(payload).eq("id", editing);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Enregistré");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-content", cfg.name] });
    qc.invalidateQueries({ queryKey: [cfg.name === "events" ? "events" : cfg.name] });
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement cet élément ?")) return;
    const { error } = await table(cfg.name).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé");
    qc.invalidateQueries({ queryKey: ["admin-content", cfg.name] });
    qc.invalidateQueries({ queryKey: [cfg.name] });
  }

  if (editing) {
    return (
      <form onSubmit={save} className="space-y-3 rounded-xl border bg-card p-4">
        <p className="font-semibold">{editing === "new" ? "Nouvel élément" : "Modifier"} · {cfg.label}</p>
        {cfg.fields.map((fl) => (
          <div key={fl.key} className="space-y-1.5">
            {fl.type === "bool" ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form[fl.key] === true} onChange={(e) => setForm({ ...form, [fl.key]: e.target.checked })} />
                {fl.label}
              </label>
            ) : (
              <>
                <Label>{fl.label}{fl.required ? " *" : ""}</Label>
                {fl.type === "textarea" ? <Textarea rows={5} maxLength={fl.max} value={String(form[fl.key] ?? "")} onChange={(e) => setForm({ ...form, [fl.key]: e.target.value })} />
                  : fl.type === "select" ? (
                    <select className={selectClass} value={String(form[fl.key] ?? "")} onChange={(e) => setForm({ ...form, [fl.key]: e.target.value })}>
                      {fl.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <Input type={fl.type === "datetime" ? "datetime-local" : fl.type === "number" ? "number" : fl.type === "url" ? "url" : "text"} min={fl.type === "number" ? 1 : undefined} maxLength={fl.max} value={String(form[fl.key] ?? "")} onChange={(e) => setForm({ ...form, [fl.key]: e.target.value })} />}
              </>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => open()}><Plus className="h-4 w-4" />Ajouter</Button>
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : q.data!.length === 0 ? <Empty text="Aucun élément." /> : (
        <ul className="grid gap-2 md:grid-cols-2">
          {q.data!.map((r) => (
            <li key={String(r["id"])} className="flex items-start gap-2 rounded-xl border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium"><span className="truncate">{String(r["title"])}</span><DemoBadge show={r["is_demo"] === true} /></p>
                <p className="text-xs text-muted-foreground">{cfg.sub(r)}</p>
              </div>
              <Button size="icon" variant="outline" aria-label="Modifier" onClick={() => open(r)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" aria-label="Supprimer" onClick={() => remove(String(r["id"]))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Contenus() {
  const { user } = Route.useRouteContext();
  const [tab, setTab] = useState(CFGS[0]!.name);
  const cfg = CFGS.find((c) => c.name === tab)!;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CFGS.map((c) => (
          <button key={c.name} onClick={() => setTab(c.name)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${tab === c.name ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{c.label}</button>
        ))}
      </div>
      <Manager key={cfg.name} cfg={cfg} userId={user.id} />
    </div>
  );
}
