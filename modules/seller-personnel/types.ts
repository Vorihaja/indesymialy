export type SellerPersonnelMember = {
  profileId: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  membershipRole: string | null;
  accessStatus: string;
  joinedAt: string | null;
  department: string | null;
  contractType: string | null;
  location: string | null;
  availability: string | null;
  employmentStatus:
    | "active"
    | "on_leave"
    | "inactive";
  monthlyCompensation: number | null;
  currency: string;
};

export type SellerPersonnelInvitation = {
  id: string;
  profileId: string | null;
  target: string;
  email: string | null;
  memberRole: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export type SellerPersonnelInternalRole = {
  id: string;
  code: string;
  label: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
};

export type SellerPersonnelRoleAssignment = {
  roleId: string;
  profileId: string;
};

export type SellerPersonnelAssignmentStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type SellerPersonnelAssignment = {
  id: string;
  profileId: string;
  mission: string;
  scope: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: SellerPersonnelAssignmentStatus;
  createdAt: string;
};

export type SellerPersonnelAttendance = {
  id: string;
  profileId: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  note: string | null;
};

export type SellerPersonnelLeave = {
  id: string;
  profileId: string;
  type: string;
  startsOn: string;
  endsOn: string;
  status:
    | "pending"
    | "approved"
    | "declined"
    | "cancelled";
  decisionAt: string | null;
  createdAt: string;
};

export type SellerPersonnelDocument = {
  id: string;
  profileId: string;
  name: string;
  category: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  expiresAt: string | null;
  status: "active" | "archived";
  createdAt: string;
};

export type SellerPersonnelSnapshot = {
  organizationId: string;
  organizationName: string;
  members: SellerPersonnelMember[];
  invitations: SellerPersonnelInvitation[];
  internalRoles: SellerPersonnelInternalRole[];
  roleAssignments: SellerPersonnelRoleAssignment[];
  assignments: SellerPersonnelAssignment[];
  attendance: SellerPersonnelAttendance[];
  leaves: SellerPersonnelLeave[];
  documents: SellerPersonnelDocument[];
};

export type PersonnelProfileInput = {
  profileId: string;
  department: string;
  contractType: string;
  location: string;
  availability: string;
  monthlyCompensation: number | null;
  currency: string;
  employmentStatus:
    | "active"
    | "on_leave"
    | "inactive";
};

export type PersonnelAssignmentInput = {
  id?: string | null;
  profileId: string;
  mission: string;
  scope?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: SellerPersonnelAssignmentStatus;
};

export type PersonnelLeaveInput = {
  id?: string | null;
  profileId: string;
  type: string;
  startsOn: string;
  endsOn: string;
};

export type PersonnelDocumentInput = {
  profileId: string;
  name: string;
  category: string;
  expiresAt?: string | null;
};