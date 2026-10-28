import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.json";
import { publicUrl } from "@/lib/public-url";
import { supabase } from "@/integrations/supabase/client";
import { useMembership, fmtDate, STATUS_LABEL } from "@/lib/session";
import { Loading, PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/carte")({
  head: () => ({ meta: [{ title: "Adhésion — UNTRTCI" }, { name: "description", content: "Adhésion numérique UNTRTCI." }, { property: "og:title", content: "Ma carte — UNTRTCI" }, { property: "og:description", content: "Carte de membre numérique." }] }),
  component: Carte,
});

function Carte() {
  const { user } = Route.useRouteContext();
  const m = useMembership(user.id);
  const photo = useQuery({
    queryKey: ["photo", m.data?.photo_url],
    enabled: !!m.data?.photo_url,
    queryFn: async () => (await supabase.storage.from("member-photos").createSignedUrl(m.data!.photo_url!, 3600)).data?.signedUrl ?? null,
  });
  if (m.isLoading) return <Loading />;
  const d = m.data;
  const valid = d && d.status === "validee" && !d.card_revoked && d.card_token;

  if (!valid) {
    return (
      <div>
        <PageHeader title="Adhésion" />
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {d ? `Adhésion indisponible — statut : ${STATUS_LABEL[d.status]}${d.card_revoked ? " (carte révoquée)" : ""}.` : "Vous devez d'abord faire une demande d'adhésion."}
          <Button asChild className="mt-4 w-full"><Link to="/adhesion">Mon dossier</Link></Button>
        </div>
      </div>
    );
  }
  const url = `${publicUrl()}/verifier/${d.card_token}`;
  return (
    <div>
      <PageHeader title="Adhésion" subtitle="Présentez ce QR code pour être vérifié" />
      <div className="relative overflow-hidden rounded-2xl bg-member-card p-5 text-primary-foreground shadow-soft">
        <div className="flex items-center gap-3">
          <img src={logo.url} alt="" className="h-9 w-auto rounded bg-card p-0.5" />
          <div className="text-[10px] uppercase leading-tight tracking-wider opacity-90">Carte d'adhésion<br />Union Nationale des Techniciens Radio et TV de CI</div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          {photo.data ? <img src={photo.data} alt="" className="h-20 w-16 rounded-lg object-cover" /> : <div className="h-20 w-16 rounded-lg bg-card/20" />}
          <div>
            <p className="text-lg font-bold leading-tight">{d.prenoms} {d.nom}</p>
            <p className="text-sm opacity-90">{d.ville}</p>
            <p className="mt-1 font-mono text-sm">{d.member_number}</p>
          </div>
        </div>
        <p className="mt-4 text-xs opacity-90">Valide jusqu'au {fmtDate(d.expires_at)}</p>
      </div>
      <div className="mt-5 flex flex-col items-center rounded-2xl border bg-card p-5">
        <QRCodeSVG value={url} size={200} level="M" />
        <p className="mt-3 text-center text-xs text-muted-foreground">Le QR code contient uniquement un identifiant aléatoire, sans données personnelles.</p>
      </div>
    </div>
  );
}
