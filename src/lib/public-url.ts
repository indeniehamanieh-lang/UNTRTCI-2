// Adresse web publique (QR code, liens des e-mails). Dans l'APK, window.location.origin vaut
// "https://localhost", d'où la variable VITE_PUBLIC_URL.
export function publicUrl(): string {
  const configured = (import.meta.env["VITE_PUBLIC_URL"] as string | undefined)?.trim().replace(/\/+$/, "");
  return configured || window.location.origin;
}
