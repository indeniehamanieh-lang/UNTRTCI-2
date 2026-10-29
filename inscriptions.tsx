import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { table, type Row } from "@/lib/admin-utils";
import { Loading, Empty, ErrorBox } from "@/components/ui-states";

export const Route = createFileRoute("/_authenticated/admin/inscriptions")({
  beforeLoad: ({ context }) => { if (!context.isManager) throw redirect({ to: "/admin" }); },
  component: Inscriptions,
});

const KINDS = {
  formations: { label: "Formations", items: "trainings", regs: "training_registrations", fk: "training_id", noun: "inscrit" },
  evenements: { label: "Événements", items: "events", regs: "event_registrations", fk: "event_id", noun: "participant" },
  offres: { label: "Offres", items: "jobs", regs: "job_applications", fk: "job_id", noun: "candidat" },
} as const;

function Inscriptions() {
  const [kind, setKind] = useState<keyof typeof KINDS>("formations");
  const k = KINDS[kind];
  const q = useQuery({
    queryKey: ["admin-regs", kind],
    queryFn: async () => {
      const [items, regs, members] = await Promise.all([
        table(k.items).select("*").order("created_at", { ascending: false }),
        table(k.regs).select("*"),
        supabase.from("memberships").select("user_id,nom,prenoms,telephone,ville"),
      ]);
      if (items.error) throw items.error;
      if (regs.error) throw regs.error;
      const byUser = new Map((members.data ?? []).map((m) => [m.user_id, m]));
      return (items.data as Row[]).map((it) => ({
        it,
        people: (regs.data as Row[]).filter((r) => r[k.fk] === it["id"]).map((r) => ({ r, m: byUser.get(String(r["user_id"])) })),
      }));
    },
  });
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(Object.keys(KINDS) as (keyof typeof KINDS)[]).map((x) => (
          <button key={x} onClick={() => setKind(x)} className={`rounded-full border px-3 py-1 text-xs ${kind === x ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{KINDS[x].label}</button>
        ))}
      </div>
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : q.data!.length === 0 ? <Empty text="Rien à afficher." /> : (
        <ul className="space-y-3">
          {q.data!.map(({ it, people }) => (
            <li key={String(it["id"])} className="rounded-xl border bg-card p-4">
              <p className="font-semibold">{String(it["title"])}</p>
              <p className="text-xs text-muted-foreground">{people.length} {k.noun}{people.length > 1 ? "s" : ""}{it["starts_at"] ? ` · ${fmtDate(it["starts_at"] as string)}` : ""}</p>
              {people.length > 0 && (
                <ul className="mt-2 divide-y text-sm">
                  {people.map(({ r, m }) => (
                    <li key={String(r["id"])} className="py-2">
                      <p className="font-medium">{m ? `${m.prenoms} ${m.nom}` : "Membre sans dossier"}</p>
                      {m && <a className="text-xs text-primary" href={`tel:${m.telephone.replace(/\s/g, "")}`}>{m.telephone} · {m.ville}</a>}
                      {typeof r["message"] === "string" && r["message"] && <p className="mt-1 text-xs text-muted-foreground">« {r["message"]} »</p>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
