import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ClipboardList, Home, LifeBuoy, LogOut, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/plus")({ component: Plus });

function Plus() {
  const { isManager, isSuper } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const items = [
    { to: "/admin/inscriptions", label: "Inscriptions", desc: "Formations, événements et candidatures", icon: ClipboardList, show: isManager },
    { to: "/admin/support", label: "Assistance", desc: "Répondre aux demandes des adhérents", icon: LifeBuoy, show: isManager },
    { to: "/admin/equipe", label: "Équipe et journal", desc: "Rôles et historique des actions", icon: ShieldCheck, show: isSuper },
    { to: "/accueil", label: "Retour à l'application", desc: "Voir l'application comme un adhérent", icon: Home, show: true },
    { to: "/profil", label: "Mon profil", desc: "Mot de passe et informations", icon: User, show: true },
  ] as const;
  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }
  return (
    <div className="space-y-2">
      {items.filter((i) => i.show).map((i) => (
        <Link key={i.to} to={i.to} className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <span className="rounded-lg bg-secondary p-2.5 text-primary"><i.icon className="h-5 w-5" /></span>
          <span className="flex-1">
            <span className="block font-medium">{i.label}</span>
            <span className="block text-xs text-muted-foreground">{i.desc}</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ))}
      <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left text-destructive">
        <span className="rounded-lg bg-destructive/10 p-2.5"><LogOut className="h-5 w-5" /></span>
        <span className="font-medium">Se déconnecter</span>
      </button>
    </div>
  );
}
