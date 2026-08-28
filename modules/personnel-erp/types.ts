export type PersonnelTab = 'directory' | 'invitations' | 'roles' | 'assignments' | 'attendance' | 'leave' | 'documents' | 'payroll';

export type PersonnelStatus = 'Actif' | 'En congé' | 'Invité' | 'Suspendu';

export type PersonnelMember = {
  id: string;
  name: string;
  handle: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  contract: string;
  location: string;
  status: PersonnelStatus;
  joinedAt: string;
  availability: string;
  monthlyCompensation: number;
};

export type PersonnelInvitation = { id: string; recipient: string; email: string; role: string; sentAt: string; expiresAt: string; status: 'En attente' | 'Acceptée' | 'Expirée' };
export type PersonnelAssignment = { id: string; member: string; mission: string; scope: string; startsAt: string; endsAt: string; status: 'Planifiée' | 'En cours' | 'Terminée' };
export type PersonnelLeave = { id: string; member: string; type: string; period: string; days: number; status: 'À valider' | 'Approuvé' | 'Refusé' };
export type PersonnelDocument = { id: string; member: string; name: string; category: string; expiresAt: string; status: 'Valide' | 'Expire bientôt' | 'Manquant' };

export type PersonnelMockData = {
  organizationName: string;
  members: PersonnelMember[];
  invitations: PersonnelInvitation[];
  assignments: PersonnelAssignment[];
  leaves: PersonnelLeave[];
  documents: PersonnelDocument[];
};
