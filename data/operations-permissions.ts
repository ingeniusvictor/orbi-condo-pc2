import type { OperationsRole } from "./operations-types";

export type OperationPermission =
  | "lookup_emergency_contact"
  | "lookup_parking"
  | "view_shift_schedule"
  | "report_shift_gap"
  | "request_shift_replacement"
  | "manage_shift_schedule"
  | "confirm_shift_handoff"
  | "report_incident"
  | "manage_incident"
  | "manage_resident"
  | "manage_parking"
  | "review_staff_functions"
  | "review_staff_contract";

const permissions: Record<OperationsRole, readonly OperationPermission[]> = {
  administrator: [
    "lookup_emergency_contact",
    "lookup_parking",
    "view_shift_schedule",
    "report_shift_gap",
    "request_shift_replacement",
    "manage_shift_schedule",
    "confirm_shift_handoff",
    "report_incident",
    "manage_incident",
    "manage_resident",
    "manage_parking",
    "review_staff_functions",
    "review_staff_contract",
  ],
  committee: ["view_shift_schedule", "review_staff_functions"],
  concierge: [
    "lookup_emergency_contact",
    "lookup_parking",
    "view_shift_schedule",
    "report_shift_gap",
    "confirm_shift_handoff",
    "report_incident",
  ],
  mayordomo: [
    "lookup_emergency_contact",
    "lookup_parking",
    "view_shift_schedule",
    "report_shift_gap",
    "request_shift_replacement",
    "manage_shift_schedule",
    "confirm_shift_handoff",
    "report_incident",
    "manage_incident",
    "review_staff_functions",
  ],
  resident: [],
};

export function proposedPermission(role: OperationsRole, permission: OperationPermission): boolean {
  return permissions[role]?.includes(permission) ?? false;
}

export function proposedPermissionsFor(role: OperationsRole): readonly OperationPermission[] {
  return permissions[role] ?? [];
}

// Design proposal only. Enforce permissions server-side using verified identity,
// community membership and resource scope before enabling any real-data endpoint.
// Never trust a role, actor id, community id or authorization decision supplied by the client.
