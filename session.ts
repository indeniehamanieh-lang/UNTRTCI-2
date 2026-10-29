import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, loading };
}

export type Role = "super_admin" | "responsable" | "gestionnaire" | "membre";

export function useRoles(userId?: string) {
  return useQuery({
    queryKey: ["roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as Role);
      return {
        roles,
        isStaff: roles.some((r) => r !== "membre"),
        isManager: roles.includes("super_admin") || roles.includes("responsable"),
        isSuper: roles.includes("super_admin"),
      };
    },
  });
}

export function useMembership(userId?: string) {
  return useQuery({
    queryKey: ["membership", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("memberships").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente",
  validee: "Validée",
  refusee: "Refusée",
  suspendue: "Suspendue",
  expiree: "Expirée",
};

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
