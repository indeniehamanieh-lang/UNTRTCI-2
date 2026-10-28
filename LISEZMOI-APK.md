# Mise en route (à faire une seule fois)

## 1. Base de données (gratuit) — supabase.com
1. Créez un projet Supabase.
2. Ouvrez `supabase/setup.sql`, remplacez **CHANGEZ-MOI@exemple.com** par VOTRE e-mail (le futur super administrateur), puis collez tout le fichier dans SQL Editor > Run.
3. (Facultatif, pour tester) exécutez aussi `supabase/demo.sql`. À supprimer avant le lancement officiel.
4. Authentication > Sign In / Providers > Email : laissez « Confirm email » activé, mot de passe minimum 8 caractères, activez la protection contre les mots de passe compromis si elle est proposée.
5. Project Settings > API : copiez « Project URL » et la clé « anon / publishable ».

## 2. Site web public (gratuit) — Netlify ou Cloudflare Pages
Le QR code des cartes et les liens des e-mails ont besoin d'une adresse web.
1. Créez un site depuis votre dépôt GitHub. Build : `npm run build`, dossier publié : `dist`.
2. Notez l'adresse obtenue (https://…).
3. Dans Supabase > Authentication > URL Configuration : mettez cette adresse dans « Site URL » et ajoutez-la (avec `/*` à la fin) dans « Redirect URLs ».

## 3. Configuration du projet
Dans GitHub, modifiez `.env.production` : adresse Supabase, clé publique, et `VITE_PUBLIC_URL` (adresse du site web).

## 4. Construire l'APK
Onglet **Actions** > « Construire l'APK Android » > **Run workflow**. Téléchargez `UNTRTCI-Mobile-apk` (zip contenant `app-debug.apk`).

## 5. Premier administrateur
Créez un compte avec l'e-mail du point 1.2, confirmez-le, puis dans Profil appuyez sur « devenir le premier super administrateur ». Le Back-office apparaît ensuite dans Profil.
