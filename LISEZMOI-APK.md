# Obtenir l'APK de test (5 étapes)

Supabase
1. Authentication > Sign In / Providers > Email : désactiver « Confirm email » (test seulement).
2. SQL Editor : coller et lancer
   update public.app_config set value = 'votre@email.com' where key = 'first_admin_email';

GitHub
3. Ouvrir `env.production`, cliquer sur le crayon, remplacer les deux REMPLACE-MOI par le Project URL
   et la clé anon/publishable de Supabase. Commit changes.
4. Glisser le dossier `src` dans « Add file > Upload files » (il remplace l'ancien). Commit changes.
5. Remplacer le contenu de `.github/workflows/build-apk .yml` par celui du fichier `build-apk.yml` fourni.

Lancer
Actions > « Construire l'APK Android » > Run workflow. Après ~10 min : Artifacts > UNTRTCI-Mobile-apk.

Premier administrateur : créer un compte avec l'e-mail de l'étape 2, se connecter, puis Profil >
« devenir le premier super administrateur ». Le bouton Back-office apparaît alors dans Profil.
