import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — UNTRTCI" },
      { name: "description", content: "Définissez un nouveau mot de passe pour votre compte UNTRTCI." },
      { property: "og:title", content: "Nouveau mot de passe — UNTRTCI" },
      { property: "og:description", content: "Récupération de compte UNTRTCI." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("8 caractères minimum"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/accueil" });
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5"><Label>Mot de passe</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button className="w-full" size="lg" disabled={busy}>Enregistrer</Button>
      </form>
    </div>
  );
}
