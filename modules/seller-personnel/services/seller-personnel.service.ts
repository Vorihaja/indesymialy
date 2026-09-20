import {
  SellerPersonnelRepository,
} from "../repositories/seller-personnel.repository";

import type {
  PersonnelAssignmentInput,
  PersonnelDocumentInput,
  PersonnelLeaveInput,
  PersonnelProfileInput,
} from "../types";

export class SellerPersonnelService {
  constructor(
    private readonly repository:
      SellerPersonnelRepository,
  ) {}

  snapshot() {
    return this.repository.getSnapshot();
  }

  saveProfile(
    input: PersonnelProfileInput,
  ) {
    return this.repository.saveProfile(
      input,
    );
  }

  setAccess(
    profileId: string,
    active: boolean,
  ) {
    return this.repository.setAccess(
      profileId,
      active,
    );
  }

  invite(
    identifier: string,
    role: string,
  ) {
    return this.repository.invite(
      identifier,
      role,
    );
  }

  revokeInvitation(
    id: string,
  ) {
    return this.repository.revokeInvitation(
      id,
    );
  }

  saveInternalRole(
    id: string | null,
    label: string,
    permissions: string[],
    active: boolean,
  ) {
    return this.repository.saveInternalRole(
      id,
      label,
      permissions,
      active,
    );
  }

  setInternalRoleMembers(
    roleId: string,
    profileIds: string[],
  ) {
    return this.repository.setInternalRoleMembers(
      roleId,
      profileIds,
    );
  }

  saveAssignment(
    input: PersonnelAssignmentInput,
  ) {
    return this.repository.saveAssignment(
      input,
    );
  }

  markAttendance(
    profileId: string,
    workDate: string,
    action: "check_in" | "check_out",
  ) {
    return this.repository.markAttendance(
      profileId,
      workDate,
      action,
    );
  }

  saveLeave(
    input: PersonnelLeaveInput,
  ) {
    return this.repository.saveLeave(
      input,
    );
  }

  decideLeave(
    id: string,
    status:
      | "approved"
      | "declined"
      | "cancelled",
  ) {
    return this.repository.decideLeave(
      id,
      status,
    );
  }

  addDocument(
    organizationId: string,
    input: PersonnelDocumentInput,
    file: File,
  ) {
    return this.repository.addDocument(
      organizationId,
      input,
      file,
    );
  }

  documentUrl(
    path: string,
  ) {
    return this.repository.documentUrl(
      path,
    );
  }

  archiveDocument(
    id: string,
  ) {
    return this.repository.archiveDocument(
      id,
    );
  }
}