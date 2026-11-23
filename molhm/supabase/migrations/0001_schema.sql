-- MOLHM — schema. Run in Supabase SQL editor or `supabase db push`.
create extension if not exists pgcrypto;

create type app_role as enum ('admin', 'operations');
create type lead_status as enum (
  'new','under_review','awaiting_contact','slot_proposed','awaiting_payment',
  'confirmed','completed','closed','not_suitable');
create type plan_kind as enum ('session','package','whatsapp');

-- ---------- identity ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role app_role not null,
  created_at timestamptz not null default now()
);

create or replace function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;
create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- catalogue / CMS ----------
create table services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  parent_id uuid references services(id) on delete set null,
  title_ar text not null,
  description_ar text not null default '',
  sort int not null default 0,
  published boolean not null default true
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind plan_kind not null,
  title_ar text not null,
  description_ar text not null default '',
  sessions int,
  duration_minutes int,
  features jsonb not null default '[]',
  price_qar numeric(10,2),
  price_published boolean not null default false,   -- السعر لا يظهر إلا إذا اعتُمد
  published boolean not null default true,
  sort int not null default 0,
  check (not price_published or price_qar is not null)
);

create table site_content (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text not null default 'any',
  is_open boolean not null default true,
  check (ends_at > starts_at),
  unique (starts_at, mode)
);

create table holidays (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  label text
);

-- ---------- questionnaire definition (original form import target) ----------
create table form_questions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  section text not null,
  label_ar text not null,
  helper_ar text,
  type text not null,                    -- text | email | tel | select | scale10 | textarea | checkbox
  required boolean not null default false,
  options jsonb,
  show_if jsonb,                         -- {"key":"age_group","equals":"under_18"}
  origin text not null check (origin in ('original_form','added','provisional')),
  sort int not null default 0
);

-- ---------- leads ----------
create sequence lead_ref_seq start 1001;

create table leads (
  id uuid primary key default gen_random_uuid(),
  ref_code text unique not null default ('MLH-' || to_char(now(), 'YY') || '-' || nextval('lead_ref_seq')),
  idempotency_key text unique,
  status lead_status not null default 'new',
  priority smallint not null default 2 check (priority between 1 and 3),
  assigned_to uuid references profiles(id),
  full_name text not null,
  profession text not null,
  country text not null,
  phone text not null,
  email text not null,
  age_group text,
  is_minor boolean not null default false,
  guardian_name text,
  guardian_phone text,
  guardian_consent boolean not null default false,
  service_id uuid references services(id),
  plan_id uuid references plans(id),
  session_mode text,                      -- office | phone | online
  goal_text text,
  contact_pref text,
  preferred_slot_id uuid references availability_slots(id),
  preferred_times_text text,
  extra_notes text,                       -- «هل تود بإضافة ملاحظات/طلبات أخرى»
  referral_flag boolean not null default false,
  source text not null default 'direct',
  last_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_minor or (guardian_name is not null and guardian_consent))
);
create index leads_status_idx on leads(status, created_at desc);
create index leads_email_idx on leads(lower(email));

-- كل تقييم سجل مستقل بتاريخه → مقارنة العميل بنفسه لاحقاً (بموافقته)
create table form_answer_sets (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  kind text not null default 'initial' check (kind in ('initial','followup')),
  score_health smallint not null check (score_health between 1 and 10),
  score_spiritual smallint not null check (score_spiritual between 1 and 10),
  score_personal smallint not null check (score_personal between 1 and 10),
  score_social smallint not null check (score_social between 1 and 10),
  score_career smallint not null check (score_career between 1 and 10),
  score_education smallint not null check (score_education between 1 and 10),
  score_leisure smallint not null check (score_leisure between 1 and 10),
  compare_consent boolean not null default false,
  created_at timestamptz not null default now()
);
create index answer_sets_lead_idx on form_answer_sets(lead_id, created_at);

create table consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  kind text not null check (kind in ('privacy','guardian','share_result','compare_progress','whatsapp_followup','email_updates')),
  granted boolean not null,
  policy_version text not null,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- ---------- operations ----------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  slot_id uuid not null references availability_slots(id),
  status text not null default 'proposed' check (status in ('proposed','confirmed','cancelled')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
-- منع الحجز المزدوج: الموعد الواحد لا يُحجز إلا مرة واحدة ما دام الحجز فعّالاً
create unique index bookings_one_active_per_slot on bookings(slot_id) where status in ('proposed','confirmed');

create table booking_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  from_status lead_status,
  to_status lead_status not null,
  changed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table followup_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  assignee_id uuid references profiles(id),
  due_at timestamptz not null,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table whatsapp_subscriptions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  duration text not null check (duration in ('week','two_weeks','month')),
  starts_on date, ends_on date,
  renewed_from uuid references whatsapp_subscriptions(id),
  active boolean not null default true
);

create table audit_logs (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create table notification_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  lead_id uuid references leads(id) on delete cascade,
  payload jsonb,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- Google Sheets one-way sync outbox (idempotent by ref_code)
create table sheets_outbox (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  attempts int not null default 0,
  last_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);
create index sheets_outbox_pending on sheets_outbox(created_at) where synced_at is null;

-- ---------- triggers ----------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger leads_touch before update on leads for each row execute function touch_updated_at();

create or replace function log_status_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into booking_status_history(lead_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger leads_status_log after update on leads for each row execute function log_status_change();

-- حذف/تخزين: حذف عميل يحذف تقييماته وموافقاته (cascade). الاحتفاظ: انظر README.
alter publication supabase_realtime add table leads;
