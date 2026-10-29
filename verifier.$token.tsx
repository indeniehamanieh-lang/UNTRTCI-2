import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import logo from "@/assets/logo.json";
import { supabase } from "@/integrations/supabase/client";
import { Loading } from "@/components/ui-states";
import { STATUS_LABEL, fmtDate } from "@/lib/session";

export const Route = createFileRoute("/verifier/$token")({
  head: () => ({
    meta: [
      { title: "Vérification d'adhésion — UNTRTCI" },
      { name: "description", content: "Vérification officielle d'une adhésion UNTRTCI." },
      { property: "og:title", content: "Vérification d'adhésion — UNTRTCI" },
      { property: "og:description", content: "Vérifiez la validité d'une adhésion UNTRTCI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Verify,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Verify() {
  const { token } = Route.useParams();
  const q = useQuery({
    queryKey: ["verify", token],
    queryFn: async () => {
      if (!UUID.test(token)) return null;
      const { data, error } = await supabase.rpc("verify_card", { _token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const m = q.data;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 py-10">
      <img src={logo.url} alt="UNTRTCI" className="h-14 w-auto" />
      <h1 className="mt-4 text-xl font-bold">Vérification d'adhésion</h1>
      <div className="mt-6 w-full">
        {q.isLoading ? <Loading /> : m && m.valid ? (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <p className="mt-3 text-lg font-bold text-success">Adhésion valide</p>
            <p className="mt-4 text-xl font-semibold">{m.prenoms} {m.nom}</p>
            <p className="text-sm text-muted-foreground">N° {m.member_number} · {m.ville}</p>
            <p className="mt-2 text-xs text-muted-foreground">Valide jusqu'au {fmtDate(m.expires_at)}</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <XCircle className="mx-auto h-14 w-14 text-destructive" />
            <p className="mt-3 text-lg font-bold text-destructive">Adhésion non valide</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {m ? `Statut : ${STATUS_LABEL[m.status]}${m.status === "validee" ? " (carte révoquée ou expirée)" : ""}` : "Aucune carte ne correspond à ce code."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
