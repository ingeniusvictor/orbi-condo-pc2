/**
 * ORBI LIVING P1C command invariants.
 * Pure domain validation only; authorization and persistence remain server-side.
 */
export type ShiftAssignmentStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
export type IncidentCommandState="reported"|"acknowledged"|"assigned"|"in_progress"|"resolved"|"closed";

const shiftTransitions:Record<ShiftAssignmentStatus,readonly ShiftAssignmentStatus[]>={
 planned:["vacant","received"],
 vacant:["requested","confirmed","planned"],
 requested:["confirmed","vacant"],
 confirmed:["received","vacant"],
 received:[],
};

const incidentTransitions:Record<IncidentCommandState,readonly IncidentCommandState[]>={
 reported:["acknowledged","assigned","resolved"],
 acknowledged:["assigned","in_progress","resolved"],
 assigned:["in_progress","resolved","acknowledged"],
 in_progress:["resolved","assigned"],
 resolved:["closed","in_progress"],
 closed:[],
};

export function canTransitionShift(from:ShiftAssignmentStatus,to:ShiftAssignmentStatus):boolean{
 return from===to||shiftTransitions[from].includes(to);
}

export function canTransitionIncidentCommand(from:IncidentCommandState,to:IncidentCommandState):boolean{
 return from===to||incidentTransitions[from].includes(to);
}

export function shiftStatusRequiresAssignee(status:ShiftAssignmentStatus):boolean{
 return status==="confirmed"||status==="received";
}

export function isUuid(value:unknown):value is string{
 return typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isPositiveRevision(value:unknown):value is number{
 return typeof value==="number"&&Number.isInteger(value)&&value>0&&value<=Number.MAX_SAFE_INTEGER;
}

export function isShiftAssignmentStatus(value:unknown):value is ShiftAssignmentStatus{
 return typeof value==="string"&&["planned","vacant","requested","confirmed","received"].includes(value);
}

export function isIncidentCommandState(value:unknown):value is IncidentCommandState{
 return typeof value==="string"&&["reported","acknowledged","assigned","in_progress","resolved","closed"].includes(value);
}
