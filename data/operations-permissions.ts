import type { OperationsRole } from "./operations-types";

export type OperationPermission =
  | "lookup_emergency_contact"
  | "lookup_parking"
  | "report_incident"
  | "manage_incident"
  | "manage_resident"
  | "manage_parking"
  | "review_staff_functions"
  | "review_staff_contract";

const permissions: Record<OperationsRole, readonly OperationPermission[]> = {
  administrator: ["lookup_emergency_contact", "lookup_parking", "report_incident", "manage_incident", "manage_resident", "manage_parking", "review_staff_functions", "review_staff_contract"],
  committee: ["review_staff_functions"],
  concierge: ["lookup_emergency_contact", "lookup_parking", "report_incident"],
  mayordomo: ["lookup_emergency_contact", "lookup_parking", "report_incident", "manage_incident", "review_staff_functions"],
  resident: [],
};

export function proposedPermission(role: OperationsRole, permission: OperationPermission): boolean {
  return permissions[role]?.includes(permission) ?? false;
}

// Design proposal only. Enforce permissions server-side using verified identity,
// community membership and resource scope before enabling any real-data endpoint.
