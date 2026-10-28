import { supabase } from "@/integrations/supabase/client";

export type Row = Record<string, unknown>;

// Accès générique à une table (les écrans d'administration sont pilotés par configuration)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const table = (name: string) => (supabase as unknown as { from: (n: string) => any }).from(name);

export function toLocalInput(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";
