/** ORBI LIVING — cobertura urgente. Modelo sin datos personales ni pagos. */
export type CoverageStatus = "assigned" | "absence_reported" | "replacement_requested" | "replacement_confirmed" | "shift_received" | "uncovered";
export type CoverageActorRole = "concierge" | "mayordomo" | "administrator";
export interface CoverageEvent {
  id: string;
  slotId: string;
  serviceDate: string; // YYYY-MM-DD, fecha local del inicio del turno
  status: CoverageStatus;
  actorRole: CoverageActorRole;
  recordedAt: string; // ISO UTC generado por servidor en producción
  replacementStaffId?: string; // Referencia privada; nunca publicar datos personales
  noteCode?: "absence" | "replacement" | "handoff" | "other";
}
const transitions: Record<CoverageStatus, readonly CoverageStatus[]> = {
  assigned: ["absence_reported", "shift_received"],
  absence_reported: ["replacement_requested", "uncovered"],
  replacement_requested: ["replacement_confirmed", "uncovered"],
  replacement_confirmed: ["shift_received", "absence_reported"],
  shift_received: [],
  uncovered: ["replacement_requested", "replacement_confirmed"],
};
export function canTransitionCoverage(from: CoverageStatus, to: CoverageStatus): boolean {
  return transitions[from].includes(to);
}
export function transitionCoverage(current: CoverageStatus, next: CoverageStatus): CoverageStatus {
  if (!canTransitionCoverage(current, next)) throw new Error("Transición de cobertura no permitida");
  return next;
}
export function requiresCoverageAttention(status: CoverageStatus): boolean {
  return ["absence_reported", "replacement_requested", "uncovered"].includes(status);
}
// Diseño puro, no autorización: servidor debe validar rol, identidad, turno,
// fecha, sustituto, permisos, conflictos y registrar eventos inmutables.
