import type { FollowUpState } from "./operations-log";

export type HandoffStatus = "prepared" | "received";
export type TaskPriority = "routine" | "attention" | "urgent";
export type TaskStatus = "pending" | "assigned" | "done" | "cancelled";

export interface OperationalTask {
  id: string;
  communityId: string;
  summary: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  dueAt?: string;
  responsibleRole?: "concierge" | "mayordomo" | "administrator" | "cleaning";
  sourceLogEntryId?: string;
}

export interface HandoffRecord {
  id: string;
  communityId: string;
  outgoingShiftId: string;
  incomingShiftId: string;
  pendingEntryIds: readonly string[];
  preparedAt: string;
  receivedAt?: string;
  status: HandoffStatus;
}

export function prepareHandoff(input: Omit<HandoffRecord, "status" | "receivedAt">): HandoffRecord {
  if (input.outgoingShiftId === input.incomingShiftId) {
    throw new Error("El turno entrante debe ser distinto del saliente.");
  }
  return { ...input, pendingEntryIds: [...new Set(input.pendingEntryIds)], status: "prepared" };
}

export function receiveHandoff(handoff: HandoffRecord, receivedAt: string): HandoffRecord {
  if (handoff.status !== "prepared") throw new Error("La entrega ya fue recibida.");
  if (!receivedAt || Number.isNaN(Date.parse(receivedAt))) throw new Error("Fecha de recepción inválida.");
  if (Date.parse(receivedAt) < Date.parse(handoff.preparedAt)) throw new Error("Recepción anterior a preparación.");
  return { ...handoff, status: "received", receivedAt };
}

export function isPendingForHandoff(state: FollowUpState): boolean {
  return state !== "resolved";
}

// Model only: no identity proof, storage, network calls or real-data permissions.
// Server must authenticate both shifts and append immutable audit events.
