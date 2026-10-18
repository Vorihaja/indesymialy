import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolvePublicMediaEventId } from './public-media-event-link.mjs';

const repositorySource = readFileSync(
  new URL('./repositories/discovery-supabase.repository.ts', import.meta.url),
  'utf8',
);
const mediaViewSource = readFileSync(
  new URL('./components/DiscoveryViews.tsx', import.meta.url),
  'utf8',
);

test('public media links render when the referenced event is in the public snapshot', () => {
  const eventId = 'public-event-id';
  const media = { is_public: true, event_id: eventId };
  const projectedEventId = resolvePublicMediaEventId(
    media.is_public ? media.event_id : undefined,
    new Set([eventId]),
  );

  assert.equal(projectedEventId, eventId);
  assert.equal(`/events/${projectedEventId}`, `/events/${eventId}`);
  assert.match(
    repositorySource,
    /resolvePublicMediaEventId\(row\.event_id,\s*publicEventIds\)/,
  );
  assert.match(
    mediaViewSource,
    /item\.eventId\s*\?\s*<Link href=\{`\/events\/\$\{item\.eventId\}`\}[^>]*>Voir l’évènement/,
  );
});

test('public media links are hidden when the referenced event is absent from the public snapshot', () => {
  const media = {
    is_public: true,
    event_id: 'private-unpublished-or-missing-event-id',
  };
  const projectedEventId = resolvePublicMediaEventId(
    media.is_public ? media.event_id : undefined,
    new Set(),
  );

  assert.equal(projectedEventId, undefined);
  assert.match(
    repositorySource,
    /resolvePublicMediaEventId\(row\.event_id,\s*publicEventIds\)/,
  );
  assert.match(
    mediaViewSource,
    /item\.eventId\s*\?\s*<Link href=\{`\/events\/\$\{item\.eventId\}`\}[^>]*>Voir l’évènement/,
  );
});
