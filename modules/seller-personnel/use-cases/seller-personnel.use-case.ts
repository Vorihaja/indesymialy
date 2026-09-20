import {
  SellerPersonnelService,
} from "../services/seller-personnel.service";

import type {
  PersonnelAssignmentInput,
  PersonnelDocumentInput,
  PersonnelLeaveInput,
  PersonnelProfileInput,
} from "../types";

export class ManageSellerPersonnelUseCase {
  constructor(
    private readonly service:
      SellerPersonnelService,
  ) {}

  execute() {
    return this.service.snapshot();
  }

  saveProfile(
    input: PersonnelProfileInput,
  ) {
    return this.service.saveProfile(
      input,
    );
  }

  setAccess(
    profileId: string,
    active: boolean,
  ) {
    return this.service.setAccess(
      profileId,
      active,
    );
  }

  invite(
    identifier: string,
    role: string,
  ) {
    return this.service.invite(
      identifier,
      role,
    );
  }

  revokeInvitation(
    id: string,
  ) {
    return this.service.revokeInvitation(
      id,
    );
  }

  saveInternalRole(
    id: string | null,
    label: string,
    permissions: string[],
    active: boolean,
  ) {
    return this.service.saveInternalRole(
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
    return this.service.setInternalRoleMembers(
      roleId,
      profileIds,
    );
  }

  saveAssignment(
    input: PersonnelAssignmentInput,
  ) {
    return this.service.saveAssignment(
      input,
    );
  }

  markAttendance(
    profileId: string,
    workDate: string,
    action: "check_in" | "check_out",
  ) {
    return this.service.markAttendance(
      profileId,
      workDate,
      action,
    );
  }

  saveLeave(
    input: PersonnelLeaveInput,
  ) {
    return this.service.saveLeave(
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
    return this.service.decideLeave(
      id,
      status,
    );
  }

  addDocument(
    organizationId: string,
    input: PersonnelDocumentInput,
    file: File,
  ) {
    return this.service.addDocument(
      organizationId,
      input,
      file,
    );
  }

  documentUrl(
    path: string,
  ) {
    return this.service.documentUrl(
      path,
    );
  }

  archiveDocument(
    id: string,
  ) {
    return this.service.archiveDocument(
      id,
    );
  }
}