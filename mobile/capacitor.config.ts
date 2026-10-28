import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // ATTENTION : cet identifiant est définitif une fois l'app publiée sur le Play Store.
  appId: "com.untrtci.mobile",
  appName: "UNTRTCI Mobile",
  // Le site est intégré dans l'APK (aucun hébergeur nécessaire pour faire tourner l'app)
  webDir: "../dist",
  android: { allowMixedContent: false },
};

export default config;
