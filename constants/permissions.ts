/**
 * =====================================================
 * INDESY MIALY
 * RBAC PERMISSIONS
 * =====================================================
 */



export const PERMISSIONS = {


  PROFILE_EDIT:
    "profile.edit",



  PROFILE_VIEW:
    "profile.view",



  EVENT_CREATE:
    "event.create",



  EVENT_MANAGE:
    "event.manage",



  CLUB_MEMBERS_MANAGE:
    "club.members.manage",



  MARKETPLACE_SELL:
    "marketplace.sell",



  FIGHTER_MANAGE:
    "fighter.manage",



  FIGHT_LIVE_MANAGE:
    "fight.live.manage",



  CONTENT_MODERATE:
    "content.moderate",



  USER_MANAGE:
    "user.manage",



  DATABASE_MANAGE:
    "database.manage",



} as const;




export type PermissionCode =
  typeof PERMISSIONS[keyof typeof PERMISSIONS];