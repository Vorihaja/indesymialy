const decisionBearingCategories = new Set([
  "fight_proposal",
  "sponsoring",
  "event",
  "role",
]);

const activityCategories = new Set([
  "fight_live",
]);

export function isDecisionBearingNotification(notification) {
  return notification.actionRequired === true ||
    decisionBearingCategories.has(notification.category);
}

export function isActivityNotification(notification) {
  return activityCategories.has(notification.category) &&
    !isDecisionBearingNotification(notification);
}

export function projectKoranaActivities(notifications) {
  return notifications.filter(isActivityNotification);
}