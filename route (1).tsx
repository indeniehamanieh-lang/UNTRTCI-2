import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { Home, Users, GraduationCap, Bell, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { mode: "signin" } });
    return { user: data.session.user };
  },
  component: Shell,
});

const tabs = [
  { to: "/accueil", label: "Accueil", icon: Home },
  { to: "/membres", label: "Membres", icon: Users },
  { to: "/formations", label: "Formations", icon: GraduationCap },
  { to: "/notifications", label: "Alertes", icon: Bell },
  { to: "/profil", label: "Profil", icon: User },
] as const;

function Shell() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  return (
    <div className={`mx-auto min-h-screen bg-background ${isAdmin ? "max-w-2xl" : "max-w-md"}`}>
      <main className="px-4 pb-28 pt-5" style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top), var(--safe-area-inset-top, 0px))" }}><Outlet /></main>
      {!isAdmin && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
          <ul className="mx-auto flex max-w-md justify-around pb-[env(safe-area-inset-bottom)]">
            {tabs.map((t) => (
              <li key={t.to}>
                <Link to={t.to} className="flex flex-col items-center gap-0.5 px-3 py-2.5 text-[11px] text-muted-foreground"
                  activeProps={{ className: "flex flex-col items-center gap-0.5 px-3 py-2.5 text-[11px] font-semibold text-primary" }}>
                  <t.icon className="h-5 w-5" />
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
