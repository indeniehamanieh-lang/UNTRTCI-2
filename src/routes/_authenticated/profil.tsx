import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMembership, useRoles, STATUS_LABEL } from "@/lib/session";
import { PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil — UNTRTCI" }, { name: "description", content: "Votre profil de technicien." }, { property: "og:title", content: "Profil — UNTRTCI" }, { property: "og:description", content: "Paramètres du compte." }] }),
  component: Profil,
});

const ROLE_LABEL: Record<string, string> = { super_admin: "Super administrateur", responsable: "Responsable de l'Union", gestionnaire: "Gestionnaire de contenu", membre: "Technicien membre" };

function Profil() {
  const { user } = Route.useRouteContext();
  const m = useMembership(user.id);
  const roles = useRoles(user.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("8 caractères minimum"); return; }
    if (!user.email) { toast.error("Compte sans e-mail"); return; }
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: cur });
    if (check.error) { toast.error("Mot de passe actuel incorrect."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    setCur(""); setPw("");
    toast.success("Mot de passe modifié");
  }
  async function claimAdmin() {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error) { toast.error(error.message); return; }
    if (!data) { toast.error("Action non autorisée."); return; }
    toast.success("Vous êtes maintenant super administrateur.");
    qc.invalidateQueries({ queryKey: ["roles"] });
    qc.invalidateQueries({ queryKey: ["can-claim-admin"] });
  }

  const canClaim = useQuery({
    queryKey: ["can-claim-admin", user.id],
    queryFn: async () => { const { data } = await supabase.rpc("can_claim_first_admin"); return data === true; },
  });

  const links = [
    { to: "/adhesion", label: "Mon dossier" },
    { to: "/carte", label: "Mon adhésion" },
    { to: "/offres", label: "Emplois et missions" },
    { to: "/documents", label: "Documents officiels" },
    { to: "/assistance", label: "Assistance et réclamations" },
  ] as const;

  return (
    <div className="space-y-5">
      <PageHeader title="Profil" />
      <div className="rounded-xl border bg-card p-4">
        <p className="font-semibold">{m.data ? `${m.data.prenoms} ${m.data.nom}` : user.email}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-2 text-xs text-muted-foreground">Adhésion : {m.data ? STATUS_LABEL[m.data.status] : "aucune demande"}</p>
        <div className="mt-2 flex flex-wrap gap-1">{roles.data?.roles.map((r) => <span key={r} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">{ROLE_LABEL[r]}</span>)}</div>
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {roles.data?.isStaff && (
          <li><Link to="/admin" className="flex items-center gap-2 p-4 font-medium text-primary"><ShieldCheck className="h-4 w-4" /><span className="flex-1">Back-office</span><ChevronRight className="h-4 w-4" /></Link></li>
        )}
        {links.map((l) => (
          <li key={l.to}><Link to={l.to} className="flex items-center p-4"><span className="flex-1">{l.label}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link></li>
        ))}
      </ul>
      <form onSubmit={changePw} className="space-y-3 rounded-xl border bg-card p-4">
        <p className="font-semibold">Changer le mot de passe</p>
        <div className="space-y-1.5"><Label>Mot de passe actuel</Label><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Nouveau mot de passe</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button size="sm" variant="outline">Modifier</Button>
      </form>
      {canClaim.data === true && (
        <button onClick={claimAdmin} className="w-full text-center text-xs text-muted-foreground underline">Configuration initiale : devenir le premier super administrateur</button>
      )}
      <Button variant="destructive" className="w-full" onClick={logout}><LogOut className="h-4 w-4" />Se déconnecter</Button>
    </div>
  );
}
