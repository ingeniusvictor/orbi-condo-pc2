/**
 * ORBI LIVING: in-memory demo workflow. Not for operational or personal data.
 * Actual confirmations require authenticated server-side identity and audit trail.
 */
export type DemoShift = "morning" | "afternoon" | "night";
export type DemoPriority = "normal" | "important" | "urgent";
export type DemoHandoffStatus = "draft" | "submitted" | "acknowledged";
export interface DemoPendingItem {
  id: string;
  description: string;
  priority: DemoPriority;
  resolved: boolean;
}
export interface DemoHandoff {
  id: string;
  outgoing: DemoShift;
  incoming: DemoShift;
  status: DemoHandoffStatus;
  pending: DemoPendingItem[];
  submittedAt?: string;
  acknowledgedAt?: string;
}
const nextShift: Record<DemoShift, DemoShift> = {
  morning: "afternoon",
  afternoon: "night",
  night: "morning",
};
export function prepareDemoHandoff(id: string, outgoing: DemoShift, pending: DemoPendingItem[]): DemoHandoff {
  return {
    id,
    outgoing,
    incoming: nextShift[outgoing],
    status: "draft",
    pending: pending.filter(item => !item.resolved).map(item => ({ ...item })),
  };
}
export function submitDemoHandoff(handoff: DemoHandoff, at: string): DemoHandoff {
  if (handoff.status !== "draft") throw new Error("Solo se puede enviar un borrador.");
  if (!at) throw new Error("Se requiere una marca temporal.");
  return { ...handoff, status: "submitted", submittedAt: at };
}
export function acknowledgeDemoHandoff(handoff: DemoHandoff, at: string): DemoHandoff {
  if (handoff.status !== "submitted") throw new Error("La entrega debe estar enviada antes de confirmarse.");
  if (!at) throw new Error("Se requiere una marca temporal.");
  return { ...handoff, status: "acknowledged", acknowledgedAt: at };
}
