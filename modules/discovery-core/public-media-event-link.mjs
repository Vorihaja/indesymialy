/**
 * @param {string | null | undefined} eventId
 * @param {ReadonlySet<string>} publicEventIds
 * @returns {string | undefined}
 */
export function resolvePublicMediaEventId(eventId, publicEventIds) {
  return eventId && publicEventIds.has(eventId) ? eventId : undefined;
}
