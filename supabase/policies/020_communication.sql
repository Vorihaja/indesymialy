-- Communication policies. Participant checks always use conversation_participants.

create policy conversation_preferences_owner_read on public.conversation_user_preferences for select to authenticated
using (profile_id=auth.uid() and exists (select 1 from public.conversation_participants cp where cp.conversation_id=conversation_id and cp.profile_id=auth.uid() and cp.left_at is null));
create policy conversation_preferences_owner_write on public.conversation_user_preferences for all to authenticated
using (profile_id=auth.uid())
with check (profile_id=auth.uid() and exists (select 1 from public.conversation_participants cp where cp.conversation_id=conversation_id and cp.profile_id=auth.uid() and cp.left_at is null));

create policy communication_blocks_owner on public.communication_blocks for all to authenticated
using (blocker_profile_id=auth.uid()) with check (blocker_profile_id=auth.uid());

create policy delivery_receipts_participant_read on public.message_delivery_receipts for select to authenticated
using (exists (select 1 from public.messages m join public.conversation_participants cp on cp.conversation_id=m.conversation_id where m.id=message_id and cp.profile_id=auth.uid() and cp.left_at is null));
create policy delivery_receipts_owner_write on public.message_delivery_receipts for insert to authenticated
with check (profile_id=auth.uid() and exists (select 1 from public.messages m join public.conversation_participants cp on cp.conversation_id=m.conversation_id where m.id=message_id and cp.profile_id=auth.uid() and cp.left_at is null));

create policy notification_preferences_owner on public.notification_preferences for all to authenticated
using (profile_id=auth.uid()) with check (profile_id=auth.uid());

create policy fight_proposal_history_participant_read on public.fight_proposal_history for select to authenticated
using (exists (select 1 from public.fight_proposals fp join public.messages m on m.id=fp.message_id join public.conversation_participants cp on cp.conversation_id=m.conversation_id where fp.id=fight_proposal_id and cp.profile_id=auth.uid() and cp.left_at is null));
create policy fight_proposal_history_actor_insert on public.fight_proposal_history for insert to authenticated
with check (changed_by=auth.uid() and exists (select 1 from public.fight_proposals fp join public.messages m on m.id=fp.message_id join public.conversation_participants cp on cp.conversation_id=m.conversation_id where fp.id=fight_proposal_id and cp.profile_id=auth.uid() and cp.left_at is null));

create policy sponsor_offer_history_participant_read on public.sponsor_offer_history for select to authenticated
using (exists (select 1 from public.sponsor_offers so join public.messages m on m.id=so.message_id join public.conversation_participants cp on cp.conversation_id=m.conversation_id where so.id=sponsor_offer_id and cp.profile_id=auth.uid() and cp.left_at is null));
create policy sponsor_offer_history_actor_insert on public.sponsor_offer_history for insert to authenticated
with check (changed_by=auth.uid() and exists (select 1 from public.sponsor_offers so join public.messages m on m.id=so.message_id join public.conversation_participants cp on cp.conversation_id=m.conversation_id where so.id=sponsor_offer_id and cp.profile_id=auth.uid() and cp.left_at is null));
