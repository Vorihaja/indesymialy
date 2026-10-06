export type OrganizationPersonnelMember = {
  id: string;
  organizationId: string;
  profileId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string | null;
};

export type OrganizationPersonnelSnapshot = {
  organizationId: string | null;
  organizationName: string;
  members: OrganizationPersonnelMember[];
};
