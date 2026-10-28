# Contrôle de sécurité (résumé)

Corrigé :
- Premier administrateur : n'importe quel inscrit pouvait le devenir. Désormais réservé à l'e-mail configuré dans setup.sql, confirmé.
- Fonctions de la base ouvertes à tous par défaut : tout est retiré puis accordé fonction par fonction.
- Support : un responsable pouvait modifier le message d'un membre ; seuls statut et réponse sont modifiables.
- Documents : liens `javascript:` interdits (base de données et affichage).
- Photos : 2 Mo et JPEG/PNG/WebP seulement, dossier privé par membre.
- Mot de passe : l'ancien mot de passe est vraiment vérifié avant changement.
- Formations : le nombre de places est enforcé côté base.
- Cartes : un jeton de carte n'est plus régénéré à chaque validation.
- Notifications : un membre-staff ne voit plus les notifications privées des autres.
- Connexion Google (passait par Lovable) retirée.

À faire de votre côté : garder la clé « service_role » de Supabase secrète (ne jamais la mettre dans GitHub), garder l'e-mail de confirmation activé, sauvegarder la base régulièrement.
Pour le Play Store : politique de confidentialité en ligne et suppression de compte dans l'app (prochaine étape).

## Pièce d'identité
- Photo prise avec le téléphone, réduite avant envoi, stockée dans un dossier privé séparé (`member-documents`).
- Visible uniquement par le membre et les responsables ; chaque consultation est inscrite dans le journal.
- Validation impossible sans pièce ni consentement ; après vérification, le responsable peut supprimer les images.
- Pour le Play Store : déclarez la collecte de pièces d'identité dans « Sécurité des données » et mentionnez-la dans la politique de confidentialité.
