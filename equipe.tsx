import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { selectClass } from "@/lib/admin-utils";
import { Loading, Empty, ErrorBox } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["app_role"];

export const Route = createFileRoute("/_authenticated/admin/equipe")({
  beforeLoad: ({ context }) => { if (!context.isSuper) throw redirect({ to: "/admin" }); },
  component: Equipe,
});

const LABEL: Record<string, string> = { super_admin: "Super administrateur", responsable: "Responsable", gestionnaire: "Gestionnaire de contenu" };

function Equipe() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("gestionnaire");
  const [busy, setBusy] = useState(false);
  const staff = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => { const { data, error } = await supabase.rpc("list_staff"); if (error) throw error; return data; },
  });
  const audit = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => { const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50); if (error) throw error; return data; },
  });
  async function change(mail: string, r: Role, grant: boolean) {
    setBusy(true);
    const { error } = await supabase.rpc("set_user_role", { _email: mail.trim(), _role: r, _grant: grant });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(grant ? "Rôle accordé" : "Rôle retiré");
    setEmail("");
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
    qc.invalidateQueries({ queryKey: ["admin-audit"] });
  }
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <p className="font-semibold">Accorder un rôle</p>
        <p className="text-xs text-muted-foreground">La personne doit déjà avoir créé un compte dans l'application.</p>
        <div className="space-y-1.5"><Label>E-mail du compte</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="gestionnaire">Gestionnaire de contenu</option><option value="responsable">Responsable</option><option value="super_admin">Super administrateur</option>
        </select>
        <Button disabled={busy || !email.includes("@")} onClick={() => change(email, role, true)}>Accorder</Button>
      </section>
      <section>
        <h2 className="mb-2 font-bold">Équipe</h2>
        {staff.isLoading ? <Loading /> : staff.error ? <ErrorBox error={staff.error} /> : staff.data!.length === 0 ? <Empty text="Personne." /> : (
          <ul className="space-y-2">
            {staff.data!.map((s) => (
              <li key={`${s.user_id}-${s.role}`} className="flex items-center gap-2 rounded-xl border bg-card p-3">
                <div className="flex-1"><p className="text-sm font-medium">{s.email}</p><p className="text-xs text-muted-foreground">{LABEL[s.role]}</p></div>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => { if (window.confirm(`Retirer le rôle « ${LABEL[s.role]} » à ${s.email} ?`)) change(s.email, s.role, false); }}>Retirer</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-2 font-bold">Journal des actions</h2>
        {audit.isLoading ? <Loading /> : audit.error ? <ErrorBox error={audit.error} /> : audit.data!.length === 0 ? <Empty text="Aucune action enregistrée." /> : (
          <ul className="divide-y rounded-xl border bg-card text-xs">
            {audit.data!.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 p-3"><span className="font-mono">{a.action}</span><span className="truncate text-muted-foreground">{a.target}</span><span className="shrink-0 text-muted-foreground">{fmtDate(a.created_at)}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
