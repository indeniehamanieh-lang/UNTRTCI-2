-- Données de démonstration FACULTATIVES (à supprimer avant le lancement : delete from <table> where is_demo)
-- ===== DONNÉES DE DÉMONSTRATION (is_demo = true) =====
insert into public.news(title, body, kind, is_demo) values
 ('[DÉMO] Bienvenue sur UNTRTCI Mobile','Ceci est une actualité de démonstration. Les vraies actualités seront publiées par les responsables de l''Union.','annonce',true),
 ('[DÉMO] Exemple de communiqué','Texte de démonstration pour illustrer l''affichage d''un communiqué officiel.','communique',true);
insert into public.events(title, description, location, starts_at, is_demo) values
 ('[DÉMO] Assemblée générale','Événement fictif de démonstration.','Abidjan', now() + interval '30 days', true);
insert into public.trainings(title, description, location, starts_at, seats, is_demo) values
 ('[DÉMO] Initiation à la TNT','Formation fictive de démonstration.','Abidjan', now() + interval '20 days', 25, true),
 ('[DÉMO] Sécurité électrique en régie','Formation fictive de démonstration.','Bouaké', now() + interval '45 days', 15, true);
insert into public.jobs(title, description, location, kind, contact, is_demo) values
 ('[DÉMO] Installation d''antennes','Mission fictive de démonstration.','Yamoussoukro','mission','contact@exemple.ci',true);

