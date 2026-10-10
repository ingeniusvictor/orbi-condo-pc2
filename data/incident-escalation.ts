/** ORBI LIVING — incident escalation model. No contacts, personal data or automated emergency calls. */
export type IncidentPriority = "low" | "medium" | "high" | "critical";
export type IncidentOperationalState = "reported" | "acknowledged" | "assigned" | "in_progress" | "resolved" | "closed";
export type IncidentArea = "access" | "common_area" | "water" | "electricity" | "elevator" | "security" | "medical" | "fire" | "other";
export type EscalationRole = "concierge" | "mayordomo" | "administrator" | "committee" | "external_service";

export interface IncidentEscalationRecord {
  id: string;
  serviceDate: string; // YYYY-MM-DD local date used for operations display.
  area: IncidentArea;
  priority: IncidentPriority;
  state: IncidentOperationalState;
  assignedRole: EscalationRole | null;
  summary: string; // Generic operational summary only in public/demo storage.
  openedAt: string;
  updatedAt: string;
}

const allowedTransitions: Record<IncidentOperationalState, readonly IncidentOperationalState[]> = {
  reported: ["acknowledged", "assigned", "resolved"],
  acknowledged: ["assigned", "in_progress", "resolved"],
  assigned: ["in_progress", "resolved", "acknowledged"],
  in_progress: ["resolved", "assigned"],
  resolved: ["closed", "in_progress"],
  closed: [],
};

export function canTransitionIncident(from: IncidentOperationalState, to: IncidentOperationalState): boolean {
  return allowedTransitions[from].includes(to);
}

export function transitionIncident(from: IncidentOperationalState, to: IncidentOperationalState): IncidentOperationalState {
  if (!canTransitionIncident(from, to)) throw new Error("Transición de incidente no permitida");
  return to;
}

export function requiresImmediateEscalation(priority: IncidentPriority): boolean {
  return priority === "critical";
}

export function requiresOperationalAttention(state: IncidentOperationalState): boolean {
  return state !== "resolved" && state !== "closed";
}

export function sanitizeDemoSummary(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

// Production boundary: authorization, notifications, emergency contacts, evidence,
// timestamps and audit events must be server-side. This module does not prove response or presence.
