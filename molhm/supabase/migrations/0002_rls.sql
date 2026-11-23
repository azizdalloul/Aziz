-- Row Level Security: لا يوجد INSERT عام. العميل يرسل عبر API خادمي بمفتاح service role.
alter table profiles enable row level security;
alter table services enable row level security;
alter table plans enable row level security;
alter table site_content enable row level security;
alter table availability_slots enable row level security;
alter table holidays enable row level security;
alter table form_questions enable row level security;
alter table leads enable row level security;
alter table form_answer_sets enable row level security;
alter table consents enable row level security;
alter table bookings enable row level security;
alter table booking_status_history enable row level security;
alter table notes enable row level security;
alter table followup_tasks enable row level security;
alter table whatsapp_subscriptions enable row level security;
alter table audit_logs enable row level security;
alter table notification_events enable row level security;
alter table sheets_outbox enable row level security;

-- profiles
create policy profiles_self_or_staff on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_admin_write on profiles for all using (is_admin()) with check (is_admin());

-- public catalogue (read published only)
create policy services_public_read on services for select using (published or is_staff());
create policy services_admin_write on services for all using (is_admin()) with check (is_admin());

create policy plans_public_read on plans for select using (published or is_staff());
create policy plans_admin_write on plans for all using (is_admin()) with check (is_admin());

create policy content_public_read on site_content for select using (true);
create policy content_admin_write on site_content for all using (is_admin()) with check (is_admin());

create policy slots_public_read on availability_slots for select using (is_open and starts_at > now() or is_staff());
create policy slots_staff_write on availability_slots for all using (is_staff()) with check (is_staff());

create policy holidays_public_read on holidays for select using (true);
create policy holidays_admin_write on holidays for all using (is_admin()) with check (is_admin());

create policy questions_public_read on form_questions for select using (true);
create policy questions_admin_write on form_questions for all using (is_admin()) with check (is_admin());

-- client data: staff only (no anon access at all)
create policy leads_staff_all on leads for all using (is_staff()) with check (is_staff());
create policy answers_staff_read on form_answer_sets for select using (is_staff());
create policy answers_staff_insert on form_answer_sets for insert with check (is_staff());
create policy consents_staff_read on consents for select using (is_staff());
create policy bookings_staff_all on bookings for all using (is_staff()) with check (is_staff());
create policy history_staff_read on booking_status_history for select using (is_staff());
create policy notes_staff_all on notes for all using (is_staff()) with check (is_staff() and author_id = auth.uid());
create policy tasks_staff_all on followup_tasks for all using (is_staff()) with check (is_staff());
create policy wa_staff_all on whatsapp_subscriptions for all using (is_staff()) with check (is_staff());
create policy notif_staff_read on notification_events for select using (is_staff());
create policy audit_admin_read on audit_logs for select using (is_admin());
-- sheets_outbox: no policies → service role only
