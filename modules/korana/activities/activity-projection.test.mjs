import assert from "node:assert/strict";
import test from "node:test";

import {
  isActivityNotification,
  isDecisionBearingNotification,
  projectKoranaActivities,
} from "./activity-projection.mjs";

test("action-required notifications are decision-bearing and excluded", () => {
  const notification = {
    category: "fight_live",
    actionRequired: true,
  };

  assert.equal(isDecisionBearingNotification(notification), true);
  assert.equal(isActivityNotification(notification), false);
  assert.deepEqual(projectKoranaActivities([notification]), []);
});

test("pending request categories never project as activities", () => {
  for (const category of ["fight_proposal", "sponsoring", "event", "role"]) {
    const notification = { category, actionRequired: false };

    assert.equal(isDecisionBearingNotification(notification), true);
    assert.equal(isActivityNotification(notification), false);
  }
});

test("supported non-actionable fight-live events project", () => {
  const activity = {
    id: "activity-1",
    category: "fight_live",
    actionRequired: false,
  };
  const ambiguous = {
    id: "ambiguous-1",
    category: "system",
    actionRequired: false,
  };

  assert.equal(isActivityNotification(activity), true);
  assert.deepEqual(
    projectKoranaActivities([activity, ambiguous]),
    [activity],
  );
});