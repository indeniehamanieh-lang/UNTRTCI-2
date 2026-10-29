import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loading, Empty, ErrorBox, PageHeader } from "@/components/ui-states";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/membres")({
  head: () => ({ meta: [{ title: "Annuaire — UNTRTCI" }, { name: "description", content: "Annuaire des techniciens membres." }, { property: "og:title", content: "Annuaire — UNTRTCI" }, { property: "og:description", content: "Trouvez un technicien." }] }),
  component: Membres,
});

function Membres() {
  const [ville, setVille] = useState("");
  const [spec, setSpec] = useState("");
  const q = useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_directory");
      if (error) throw error;
      return data;
    },
  });
  const skills = useQuery({ queryKey: ["skills"], queryFn: async () => (await supabase.from("technician_skills").select("name").order("name")).data ?? [] });
  const list = (q.data ?? []).filter((m) =>
    (!ville || m.ville.toLowerCase().includes(ville.toLowerCase())) && (!spec || m.specialites.includes(spec)));

  return (
    <div>
      <PageHeader title="Membres" subtitle="Techniciens ayant accepté d'apparaître" />
      <div className="mb-4 space-y-2">
        <Input placeholder="Filtrer par ville" value={ville} onChange={(e) => setVille(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSpec("")} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${!spec ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>Toutes</button>
          {(skills.data ?? []).map((s) => (
            <button key={s.name} onClick={() => setSpec(s.name)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${spec === s.name ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{s.name}</button>
          ))}
        </div>
      </div>
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : list.length === 0 ? <Empty text="Aucun membre trouvé." /> : (
        <ul className="space-y-2">
          {list.map((m) => (
            <li key={m.id} className="rounded-xl border bg-card p-4">
              <p className="font-semibold">{m.prenoms} {m.nom}</p>
              <p className="text-xs text-muted-foreground">{m.ville} · N° {m.member_number}</p>
              <div className="mt-2 flex flex-wrap gap-1">{m.specialites.map((s) => <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">{s}</span>)}</div>
              <a href={`tel:${m.telephone.replace(/\s/g, "")}`} className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><Phone className="h-4 w-4" />{m.telephone}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
