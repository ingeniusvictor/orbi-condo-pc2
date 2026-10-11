/** ORBI LIVING operational domain contracts. No resident records or public demo fixtures. */
export type VerificationStatus = "reported" | "pending" | "verified" | "rejected";
export type ContactRole = "owner" | "occupant" | "emergency" | "authorized";
export type ParkingKind = "assigned" | "visitor" | "accessible" | "service";
export type IncidentKind = "water" | "vehicle" | "building_damage" | "security" | "medical" | "other";
export type IncidentState = "reported" | "triaged" | "in_progress" | "resolved" | "closed";
export type OperationsRole = "administrator" | "committee" | "concierge" | "mayordomo" | "resident";
export type SourceKind = "verbal_report" | "official_document" | "resident_submission" | "administrative_review";

export interface EvidenceProvenance {
  sourceKind: SourceKind;
  status: VerificationStatus;
  recordedAt: string; // ISO timestamp
  verifiedAt?: string;
  // Store document references in protected storage; never URLs to private files in public UI.
  privateEvidenceId?: string;
}
export interface UnitRecord {
  id: string;
  communityId: string;
  towerCode: string;
  unitNumber: string;
  provenance: EvidenceProvenance;
}
export interface ContactRecord {
  id: string;
  unitId: string;
  role: ContactRole;
  // Protected backend fields; do not serialize into public pages or client bundles.
  displayName: string;
  phone?: string;
  email?: string;
  contactPreference?: "call" | "message" | "email";
  consentRecordedAt?: string;
  lawfulBasisReference?: string;
  lastConfirmedAt?: string;
  provenance: EvidenceProvenance;
}
export interface ParkingSpaceRecord {
  id: string;
  communityId: string;
  number: string;
  kind: ParkingKind;
  unitId?: string;
  provenance: EvidenceProvenance;
}
export interface VehicleAuthorizationRecord {
  id: string;
  parkingSpaceId: string;
  responsibleContactId?: string;
  plate: string; // Personal data: protect and audit access.
  validFrom: string;
  validUntil?: string;
  provenance: EvidenceProvenance;
}
export interface IncidentRecord {
  id: string;
  communityId: string;
  kind: IncidentKind;
  state: IncidentState;
  occurredAt: string;
  reportedAt: string;
  unitId?: string;
  parkingSpaceId?: string;
  vehicleAuthorizationId?: string;
  assignedOperationsRole?: OperationsRole;
  // Narrative/photos/contact attempts belong in protected, audited storage.
  privateCaseReference?: string;
  provenance: EvidenceProvenance;
}
export interface StaffRoleObservation {
  role: "concierge" | "cleaning" | "mayordomo" | "administrative";
  headcount: number;
  employmentMode?: "fixed" | "part_time" | "function_only";
  overlapsWithRole?: "concierge" | "cleaning" | "mayordomo";
  provenance: EvidenceProvenance;
}
export function distinctStaffEstimate(observations: readonly StaffRoleObservation[]): number {
  return observations.reduce((sum, item) => sum + (item.employmentMode === "function_only" ? 0 : item.headcount), 0);
}
