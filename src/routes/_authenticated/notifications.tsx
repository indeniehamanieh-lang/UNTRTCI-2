import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/session";
import { Loading, Empty, ErrorBox, PageHeader } from "@/components/ui-states";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — UNTRTCI" }, { name: "description", content: "Vos notifications UNTRTCI." }, { property: "og:title", content: "Notifications — UNTRTCI" }, { property: "og:description", content: "Messages de l'Union." }] }),
  component: Notifs,
});

function Notifs() {
  const { user } = Route.useRouteContext();
  const q = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").or(`user_id.is.null,user_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Notifications" />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : q.data!.length === 0 ? <Empty text="Aucune notification." /> : (
        <ul className="space-y-2">
          {q.data!.map((n) => (
            <li key={n.id} className="flex gap-3 rounded-xl border bg-card p-4">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{fmtDate(n.created_at)}{n.user_id ? "" : " · tous les membres"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
