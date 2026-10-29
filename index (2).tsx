import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, GraduationCap, Briefcase, Users } from "lucide-react";
import logo from "@/assets/logo.json";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UNTRTCI Mobile — Techniciens Radio et TV de Côte d'Ivoire" },
      { name: "description", content: "Adhérez à l'UNTRTCI, obtenez votre adhésion numérique, suivez les formations et les missions." },
      { property: "og:title", content: "UNTRTCI Mobile" },
      { property: "og:description", content: "L'application officielle des techniciens radio et télévision de Côte d'Ivoire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useUser();
  const features = [
    { icon: BadgeCheck, t: "Adhésion numérique", d: "Avec QR code vérifiable" },
    { icon: GraduationCap, t: "Formations et événements", d: "Inscrivez-vous en un geste" },
    { icon: Briefcase, t: "Emplois et missions", d: "Offres audiovisuelles" },
    { icon: Users, t: "Annuaire des techniciens", d: "Par ville et spécialité" },
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <div className="bg-hero px-6 pb-10 pt-12 text-primary-foreground">
        <div className="mx-auto w-fit rounded-2xl bg-card p-3 shadow-soft">
          <img src={logo.url} alt="Logo UNTRTCI" className="h-20 w-auto" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold">UNTRTCI Mobile</h1>
        <p className="mt-2 text-center text-sm opacity-90">
          Union Nationale des Techniciens Radio et Télévision de Côte d'Ivoire
        </p>
      </div>
      <div className="-mt-6 flex-1 rounded-t-3xl bg-background px-6 pt-6">
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f.t} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span className="rounded-lg bg-secondary p-2 text-primary"><f.icon className="h-5 w-5" /></span>
              <div>
                <p className="font-semibold">{f.t}</p>
                <p className="text-xs text-muted-foreground">{f.d}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 space-y-3 pb-10">
          {user ? (
            <Button asChild size="lg" className="w-full"><Link to="/accueil">Ouvrir l'application</Link></Button>
          ) : (
            <>
              <Button asChild size="lg" className="w-full"><Link to="/auth" search={{ mode: "signup" }}>Créer un compte</Link></Button>
              <Button asChild size="lg" variant="outline" className="w-full"><Link to="/auth" search={{ mode: "signin" }}>Se connecter</Link></Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
