export type OrganizationInvitation = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  memberRole: string;
  status: "pending";
  expiresAt: string;
  createdAt: string;
};