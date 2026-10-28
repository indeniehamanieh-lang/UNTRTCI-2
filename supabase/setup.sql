-- ============================================================================
-- UNTRTCI Mobile — installation de la base de données (à exécuter UNE fois)
-- AVANT de lancer : remplacez CHANGEZ-MOI@exemple.com plus bas par VOTRE adresse e-mail.
-- Seul le compte portant cet e-mail (confirmé) pourra devenir premier super administrateur.
-- ============================================================================

-- ===== CONFIGURATION PRIVÉE =====
create table public.app_config (key text primary key, value text not null);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;
insert into public.app_config(key, value) values ('first_admin_email', 'CHANGEZ-MOI@exemple.com');

-- ===== ROLES =====
create type public.app_role as enum ('super_admin','responsable','gestionnaire','membre');
create type public.membership_status as enum ('en_attente','validee','refusee','suspendue','expiree');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('super_admin','responsable','gestionnaire'))
$$;
create or replace function public.is_manager(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('super_admin','responsable'))
$$;

create policy "own roles or managers" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_manager(auth.uid()));
create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 120));
  insert into public.user_roles (user_id, role) values (new.id, 'membre');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ===== AUDIT =====
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs (created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "managers read audit" on public.audit_logs for select to authenticated using (public.is_manager(auth.uid()));

create or replace function public.log_action(_action text, _target text, _details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs(actor_id, action, target, details) values (auth.uid(), _action, _target, _details);
$$;
revoke execute on function public.log_action(text,text,jsonb) from public, anon, authenticated;

-- ===== SKILLS =====
create table public.technician_skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);
grant select on public.technician_skills to anon, authenticated;
grant insert, update, delete on public.technician_skills to authenticated;
grant all on public.technician_skills to service_role;
alter table public.technician_skills enable row level security;
create policy "skills read" on public.technician_skills for select to anon, authenticated using (true);
create policy "skills staff write" on public.technician_skills for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
insert into public.technician_skills(name) values
 ('Maintenance émetteurs'),('Réparation TV'),('Réparation radio'),('Antennes et paraboles'),('Son et sonorisation'),('Vidéo et caméra'),('Régie et diffusion'),('Électronique générale');

-- ===== MEMBERSHIPS =====
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  nom text not null check (char_length(nom) between 1 and 80),
  prenoms text not null check (char_length(prenoms) between 1 and 120),
  telephone text not null check (char_length(telephone) between 6 and 20),
  ville text not null check (char_length(ville) between 1 and 80),
  specialites text[] not null default '{}',
  photo_url text,
  id_doc_type text check (id_doc_type in ('cni','passeport','permis','autre')),
  id_front_path text,
  id_back_path text,
  id_consent boolean not null default false,
  id_verified boolean not null default false,
  directory_consent boolean not null default false,
  status public.membership_status not null default 'en_attente',
  review_note text,
  member_number text unique,
  card_token uuid unique,
  card_revoked boolean not null default false,
  validated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.memberships (status);
create index on public.memberships (ville);
grant select, insert, update on public.memberships to authenticated;
grant all on public.memberships to service_role;
alter table public.memberships enable row level security;
create policy "own or staff read membership" on public.memberships for select to authenticated
  using (user_id = auth.uid() or public.is_manager(auth.uid()));
create policy "own membership insert" on public.memberships for insert to authenticated
  with check (user_id = auth.uid());
create policy "own membership update" on public.memberships for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Protect sensitive fields: members can never change status/number/card
create or replace function public.protect_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('app.bypass_membership', true) = 'on' then
    new.updated_at := now(); return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'en_attente'; new.member_number := null; new.card_token := null;
    new.card_revoked := false; new.validated_at := null; new.expires_at := null; new.review_note := null;
    new.id_verified := false;
  else
    new.status := old.status; new.member_number := old.member_number; new.card_token := old.card_token;
    new.card_revoked := old.card_revoked; new.validated_at := old.validated_at; new.expires_at := old.expires_at;
    new.review_note := old.review_note; new.user_id := old.user_id;
    new.id_verified := old.id_verified;
    if old.id_verified then
      -- pièce déjà vérifiée : le membre ne peut plus la modifier
      new.id_doc_type := old.id_doc_type; new.id_front_path := old.id_front_path; new.id_back_path := old.id_back_path;
    end if;
    if old.status in ('validee','suspendue') then
      -- identity locked once validated; only consent/phone/city/specialities/photo editable
      new.nom := old.nom; new.prenoms := old.prenoms;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger protect_membership_trg before insert or update on public.memberships
  for each row execute function public.protect_membership();

create sequence public.member_number_seq start 1;

create or replace function public.review_membership(_id uuid, _status public.membership_status, _note text default null)
returns public.memberships language plpgsql security definer set search_path = public as $$
declare m public.memberships;
begin
  if not public.is_manager(auth.uid()) then raise exception 'Accès refusé'; end if;
  select * into m from public.memberships where id = _id for update;
  if not found then raise exception 'Dossier introuvable'; end if;
  if m.user_id = auth.uid() then raise exception 'Vous ne pouvez pas traiter votre propre dossier'; end if;
  if _status = 'validee' and not m.id_verified and (m.id_front_path is null or not m.id_consent) then
    raise exception 'Pièce d''identité ou consentement manquant : le membre doit les fournir avant validation';
  end if;
  perform set_config('app.bypass_membership','on', true);
  if _status = 'validee' then
    update public.memberships set status='validee', review_note=_note,
      member_number = coalesce(member_number, 'UNT-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.member_number_seq')::text,5,'0')),
      card_token = coalesce(card_token, gen_random_uuid()), card_revoked=false,
      validated_at = now(), expires_at = now() + interval '1 year', id_verified = true
    where id=_id returning * into m;
  else
    update public.memberships set status=_status, review_note=_note,
      card_revoked = case when _status in ('refusee','suspendue','expiree') then true else card_revoked end
    where id=_id returning * into m;
  end if;
  perform set_config('app.bypass_membership','off', true);
  perform public.log_action('membership.' || _status::text, _id::text, jsonb_build_object('note',_note,'member_number',m.member_number));
  insert into public.notifications(user_id, title, body) values (m.user_id, 'Mise à jour de votre adhésion',
    case _status when 'validee' then 'Votre adhésion est validée. Votre carte de membre est disponible.'
      when 'refusee' then 'Votre demande d''adhésion a été refusée.' || coalesce(' Motif : '||_note,'')
      when 'suspendue' then 'Votre adhésion est suspendue.' || coalesce(' Motif : '||_note,'')
      else 'Le statut de votre adhésion a changé.' end);
  return m;
end $$;

create or replace function public.revoke_card(_id uuid, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_manager(auth.uid()) then raise exception 'Accès refusé'; end if;
  perform set_config('app.bypass_membership','on', true);
  update public.memberships set card_revoked = true, card_token = gen_random_uuid() where id=_id;
  perform set_config('app.bypass_membership','off', true);
  perform public.log_action('card.revoke', _id::text, jsonb_build_object('note',_note));
end $$;

-- Consultation et suppression des pièces d'identité (tracées dans le journal)
create or replace function public.log_identity_view(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_manager(auth.uid()) then raise exception 'Accès refusé'; end if;
  perform public.log_action('identity.view', _id::text, null);
end $$;

create or replace function public.purge_identity(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_manager(auth.uid()) then raise exception 'Accès refusé'; end if;
  perform set_config('app.bypass_membership','on', true);
  update public.memberships set id_front_path = null, id_back_path = null where id = _id;
  perform set_config('app.bypass_membership','off', true);
  perform public.log_action('identity.purge', _id::text, null);
end $$;

create or replace function public.verify_card(_token uuid)
returns table(nom text, prenoms text, member_number text, ville text, status public.membership_status, expires_at timestamptz, valid boolean)
language sql stable security definer set search_path = public as $$
  select m.nom, m.prenoms, m.member_number, m.ville, m.status, m.expires_at,
    (m.status='validee' and not m.card_revoked and (m.expires_at is null or m.expires_at > now()))
  from public.memberships m where m.card_token = _token limit 1
$$;
grant execute on function public.verify_card(uuid) to anon, authenticated;

create or replace function public.list_directory()
returns table(id uuid, nom text, prenoms text, ville text, specialites text[], telephone text, member_number text)
language sql stable security definer set search_path = public as $$
  select m.id, m.nom, m.prenoms, m.ville, m.specialites, m.telephone, m.member_number
  from public.memberships m
  where m.status='validee' and m.directory_consent and not m.card_revoked and auth.uid() is not null
  order by m.nom
$$;
revoke execute on function public.list_directory() from anon;

-- ===== CONTENT =====
create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null, body text not null,
  kind text not null default 'actualite' check (kind in ('actualite','annonce','communique')),
  is_demo boolean not null default false,
  published boolean not null default true,
  author_id uuid, created_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text not null default '', location text not null default '',
  starts_at timestamptz not null, is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text not null default '', location text not null default '',
  starts_at timestamptz not null, seats int, is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text not null default '', location text not null default '',
  kind text not null default 'mission' check (kind in ('emploi','mission')),
  contact text, closes_at timestamptz, is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null, category text not null default 'Général', url text not null,
  is_demo boolean not null default false, created_at timestamptz not null default now()
);
alter table public.documents add constraint documents_url_http check (url ~* '^https?://');
create index on public.news (created_at desc);
create index on public.events (starts_at);
create index on public.trainings (starts_at);
create index on public.jobs (created_at desc);

grant select on public.news, public.events, public.trainings, public.jobs, public.documents to authenticated;
grant select on public.news to anon;
grant insert, update, delete on public.news, public.events, public.trainings, public.jobs, public.documents to authenticated;
grant all on public.news, public.events, public.trainings, public.jobs, public.documents to service_role;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.trainings enable row level security;
alter table public.jobs enable row level security;
alter table public.documents enable row level security;

create policy "news read" on public.news for select to anon, authenticated using (published or public.is_staff(auth.uid()));
create policy "news staff" on public.news for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "events read" on public.events for select to authenticated using (true);
create policy "events staff" on public.events for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "trainings read" on public.trainings for select to authenticated using (true);
create policy "trainings staff" on public.trainings for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "jobs read" on public.jobs for select to authenticated using (true);
create policy "jobs staff" on public.jobs for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "docs read" on public.documents for select to authenticated using (true);
create policy "docs staff" on public.documents for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- registrations
create table public.training_registrations (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  user_id uuid not null, created_at timestamptz not null default now(),
  unique (training_id, user_id)
);
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null, created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null, message text check (char_length(message) <= 1000),
  created_at timestamptz not null default now(),
  unique (job_id, user_id)
);
grant select, insert, delete on public.training_registrations, public.event_registrations, public.job_applications to authenticated;
grant all on public.training_registrations, public.event_registrations, public.job_applications to service_role;
alter table public.training_registrations enable row level security;
alter table public.event_registrations enable row level security;
alter table public.job_applications enable row level security;
create policy "tr own" on public.training_registrations for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "tr ins" on public.training_registrations for insert to authenticated with check (user_id = auth.uid());
create policy "tr del" on public.training_registrations for delete to authenticated using (user_id = auth.uid());
create policy "er own" on public.event_registrations for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "er ins" on public.event_registrations for insert to authenticated with check (user_id = auth.uid());
create policy "er del" on public.event_registrations for delete to authenticated using (user_id = auth.uid());
create policy "ja own" on public.job_applications for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "ja ins" on public.job_applications for insert to authenticated with check (user_id = auth.uid());
create policy "ja del" on public.job_applications for delete to authenticated using (user_id = auth.uid());

-- Places limitées des formations
create or replace function public.check_training_seats()
returns trigger language plpgsql security definer set search_path = public as $$
declare s int; n int;
begin
  select seats into s from public.trainings where id = new.training_id for update;
  if s is not null then
    select count(*) into n from public.training_registrations where training_id = new.training_id;
    if n >= s then raise exception 'Formation complète'; end if;
  end if;
  return new;
end $$;
create trigger training_seats_trg before insert on public.training_registrations
  for each row execute function public.check_training_seats();

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- null = tous les membres
  title text not null check (char_length(title) <= 120),
  body text not null check (char_length(body) <= 1000),
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);
grant select, insert, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif read" on public.notifications for select to authenticated using (user_id is null or user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "notif manager delete" on public.notifications for delete to authenticated using (public.is_manager(auth.uid()));
create policy "notif staff insert" on public.notifications for insert to authenticated with check (public.is_staff(auth.uid()));

-- support
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null default 'assistance' check (kind in ('assistance','reclamation')),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 5 and 3000),
  status text not null default 'ouverte' check (status in ('ouverte','en_cours','fermee')),
  response text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.support_requests to authenticated;
grant all on public.support_requests to service_role;
alter table public.support_requests enable row level security;
create policy "sr read" on public.support_requests for select to authenticated using (user_id = auth.uid() or public.is_manager(auth.uid()));
create policy "sr insert" on public.support_requests for insert to authenticated with check (user_id = auth.uid() and status = 'ouverte' and response is null);
revoke update on public.support_requests from authenticated;
grant update (status, response) on public.support_requests to authenticated;
create policy "sr manager update" on public.support_requests for update to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

-- Anti-abus : max 5 demandes d'assistance par 24h
create or replace function public.limit_support()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.support_requests where user_id = new.user_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Limite atteinte : 5 demandes par 24 heures';
  end if;
  return new;
end $$;
create trigger limit_support_trg before insert on public.support_requests for each row execute function public.limit_support();

-- ===== ROLE ADMIN =====
create or replace function public.can_claim_first_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and not exists (select 1 from public.user_roles where role = 'super_admin')
    and exists (
      select 1 from auth.users u join public.app_config c on c.key = 'first_admin_email'
      where u.id = auth.uid() and u.email_confirmed_at is not null and lower(u.email) = lower(c.value)
    )
$$;

create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.can_claim_first_admin() then return false; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), 'super_admin') on conflict do nothing;
  perform public.log_action('role.claim_first_admin', auth.uid()::text, null);
  return true;
end $$;

-- Un dossier refusé peut être corrigé puis renvoyé
create or replace function public.resubmit_membership()
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform set_config('app.bypass_membership','on', true);
  update public.memberships set status = 'en_attente', review_note = null
    where user_id = auth.uid() and status = 'refusee';
  get diagnostics n = row_count;
  perform set_config('app.bypass_membership','off', true);
  if n = 0 then raise exception 'Aucun dossier refusé à renvoyer'; end if;
end $$;

create or replace function public.set_user_role(_email text, _role public.app_role, _grant boolean)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.has_role(auth.uid(),'super_admin') then raise exception 'Réservé au super administrateur'; end if;
  select id into uid from auth.users where lower(email) = lower(_email);
  if uid is null then raise exception 'Aucun compte avec cet e-mail'; end if;
  if _grant then insert into public.user_roles(user_id, role) values (uid,_role) on conflict do nothing;
  else
    if uid = auth.uid() and _role='super_admin' then raise exception 'Vous ne pouvez pas retirer votre propre rôle'; end if;
    delete from public.user_roles where user_id=uid and role=_role;
  end if;
  perform public.log_action(case when _grant then 'role.grant' else 'role.revoke' end, _email, jsonb_build_object('role',_role));
end $$;

create or replace function public.list_staff()
returns table(user_id uuid, email text, role public.app_role)
language sql stable security definer set search_path = public as $$
  select r.user_id, u.email::text, r.role from public.user_roles r join auth.users u on u.id=r.user_id
  where r.role <> 'membre' and public.is_manager(auth.uid())
$$;

create or replace function public.admin_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_staff(auth.uid()) then jsonb_build_object(
    'pending', (select count(*) from public.memberships where status='en_attente'),
    'validated', (select count(*) from public.memberships where status='validee'),
    'refused', (select count(*) from public.memberships where status='refusee'),
    'suspended', (select count(*) from public.memberships where status='suspendue'),
    'users', (select count(*) from public.profiles),
    'open_support', (select count(*) from public.support_requests where status<>'fermee'),
    'training_regs', (select count(*) from public.training_registrations),
    'applications', (select count(*) from public.job_applications)
  ) else null end
$$;

-- ===== PRIVILÈGES DES FONCTIONS =====
-- Par défaut tout le monde peut exécuter les fonctions : on retire tout, puis on accorde au cas par cas.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_staff(uuid) to anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_manager(uuid) to authenticated;
grant execute on function public.verify_card(uuid) to anon, authenticated;
grant execute on function public.list_directory() to authenticated;
grant execute on function public.log_identity_view(uuid) to authenticated;
grant execute on function public.purge_identity(uuid) to authenticated;
grant execute on function public.review_membership(uuid, public.membership_status, text) to authenticated;
grant execute on function public.revoke_card(uuid, text) to authenticated;
grant execute on function public.can_claim_first_admin() to authenticated;
grant execute on function public.claim_first_admin() to authenticated;
grant execute on function public.resubmit_membership() to authenticated;
grant execute on function public.set_user_role(text, public.app_role, boolean) to authenticated;
grant execute on function public.list_staff() to authenticated;
grant execute on function public.admin_stats() to authenticated;

-- ===== STOCKAGE DES PHOTOS DE MEMBRES =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('member-photos','member-photos', false, 2097152, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "photos: envoi par le propriétaire" on storage.objects for insert to authenticated
  with check (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: mise à jour par le propriétaire" on storage.objects for update to authenticated
  using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: lecture propriétaire ou staff" on storage.objects for select to authenticated
  using (bucket_id = 'member-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())));

-- ===== PIÈCES D'IDENTITÉ (dossier privé, séparé des photos) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('member-documents','member-documents', false, 3145728, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "pièces: envoi par le propriétaire" on storage.objects for insert to authenticated
  with check (bucket_id = 'member-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pièces: lecture propriétaire ou responsable" on storage.objects for select to authenticated
  using (bucket_id = 'member-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_manager(auth.uid())));
create policy "pièces: suppression propriétaire ou responsable" on storage.objects for delete to authenticated
  using (bucket_id = 'member-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_manager(auth.uid())));
