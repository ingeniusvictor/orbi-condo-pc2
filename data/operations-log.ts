import type { EvidenceProvenance, IncidentKind, IncidentState, OperationsRole } from "./operations-types";

export type LogCategory = "access" | "parcel" | "maintenance" | "parking" | "incident" | "handoff" | "other";
export type FollowUpState = "open" | "assigned" | "resolved";

export interface ShiftLogEntry {
  id: string;
  communityId: string;
  shiftId: string;
  createdAt: string;
  category: LogCategory;
  summary: string;
  followUp: FollowUpState;
  assignedRole?: OperationsRole;
  relatedIncidentId?: string;
  privateEvidenceIds?: string[];
  provenance: EvidenceProvenance;
}

export interface ShiftHandoff {
  id: string;
  communityId: string;
  outgoingShiftId: string;
  incomingShiftId: string;
  createdAt: string;
  pendingLogEntryIds: string[];
  acknowledgedAt?: string;
}

export interface IncidentWorkflow {
  incidentId: string;
  kind: IncidentKind;
  state: IncidentState;
  openedAt: string;
  escalatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  assignedRole?: OperationsRole;
  privateContactAttemptIds: string[];
  privateEvidenceIds: string[];
}

// This file defines types only: no persistence, public endpoints or personal data.
