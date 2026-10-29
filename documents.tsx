import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loading, Empty, ErrorBox, PageHeader, DemoBadge } from "@/components/ui-states";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents — UNTRTCI" }, { name: "description", content: "Documents officiels de l'Union." }, { property: "og:title", content: "Documents — UNTRTCI" }, { property: "og:description", content: "Statuts, règlements et communiqués." }] }),
  component: Docs,
});

function Docs() {
  const q = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Documents officiels" />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : q.data!.length === 0 ? <Empty text="Aucun document publié pour le moment." /> : (
        <ul className="space-y-2">
          {q.data!.map((d) => (
            <li key={d.id}>
              <a href={/^https?:\/\//i.test(d.url) ? d.url : "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border bg-card p-4">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1"><p className="font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.category}</p></div>
                <DemoBadge show={d.is_demo} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
