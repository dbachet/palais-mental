-- ═══════════════════════════════════════════════════════════════
-- MENTAL PALACE - Base de données du compte en ligne (Supabase)
-- ═══════════════════════════════════════════════════════════════
-- À coller une fois dans Supabase → SQL Editor → Run.
-- Peut être relancé sans risque : rien n'est effacé.
--
-- Un compte = un enfant = une ligne de `palaces`.
-- `data` : { clé du localStorage: { v: valeur, t: heure du changement } }
-- `version` : augmente de 1 à chaque écriture. L'app n'écrit que si la
--   version n'a pas bougé depuis sa lecture (voir js/sync.js).

create table if not exists public.palaces (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  version    bigint not null default 1,
  device     text,
  updated_at timestamptz not null default now(),
  -- Un palais pèse quelques dizaines de Ko : 2 Mo laisse de la marge et bloque les abus
  constraint palaces_data_size check (octet_length(data::text) < 2000000)
);

-- Une copie par jour et par compte : l'état du palais AVANT la première
-- écriture de la journée. Gardée 30 jours. Filet de sécurité si un
-- appareil envoie de mauvaises données.
create table if not exists public.palace_history (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  data     jsonb not null,
  version  bigint not null,
  saved_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Chacun ne voit et ne modifie que sa propre ligne
alter table public.palaces enable row level security;
alter table public.palace_history enable row level security;

drop policy if exists "palaces_select_own" on public.palaces;
create policy "palaces_select_own" on public.palaces
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "palaces_insert_own" on public.palaces;
create policy "palaces_insert_own" on public.palaces
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "palaces_update_own" on public.palaces;
create policy "palaces_update_own" on public.palaces
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- L'historique se lit, mais seul le déclencheur ci-dessous y écrit
drop policy if exists "palace_history_select_own" on public.palace_history;
create policy "palace_history_select_own" on public.palace_history
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.palaces, public.palace_history from anon;
grant select, insert, update on public.palaces to authenticated;
-- Sans connexion, la lecture est permise mais ne renvoie aucune ligne (aucune
-- règle ci-dessus ne concerne `anon`). Sert au ping de .github/workflows/keepalive.yml.
grant select on public.palaces to anon;
grant select on public.palace_history to authenticated;

create or replace function public.palaces_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  insert into public.palace_history (user_id, day, data, version)
  values (old.user_id, current_date, old.data, old.version)
  on conflict (user_id, day) do nothing;
  delete from public.palace_history
  where user_id = old.user_id and day < current_date - 30;
  return new;
end;
$$;

drop trigger if exists palaces_before_update on public.palaces;
create trigger palaces_before_update
  before update on public.palaces
  for each row execute function public.palaces_before_update();

-- ───────────────────────────────────────────────────────────────
-- Dépannage : remettre le palais d'un compte dans l'état d'un jour donné
-- (à lancer à la main ici, en remplaçant l'email et la date)
-- ───────────────────────────────────────────────────────────────
-- update public.palaces p
-- set data = h.data, version = p.version + 1
-- from public.palace_history h
-- where h.user_id = p.user_id
--   and h.day = date '2026-09-20'
--   and p.user_id = (select id from auth.users where email = 'parent@example.com');
--
-- Attention : les clés restaurées gardent leur ancienne heure `t`. Un appareil
-- qui a des données plus récentes les renverra. Pour forcer la restauration,
-- déconnecter les appareils avant, ou restaurer depuis un fichier JSON.
