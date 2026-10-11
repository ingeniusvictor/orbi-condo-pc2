export type ShiftLogState="open"|"closed";
export type ShiftLogEntryCode="routine_check"|"visitor_flow"|"delivery_received"|"equipment_check"|"maintenance_notice"|"incident_followup"|"handoff_pending"|"other";
export type ShiftLogCategory="access"|"security"|"maintenance"|"utilities"|"resident_support"|"delivery"|"other";
export type ShiftLogSeverity="info"|"attention"|"urgent";
export type ShiftLogClosureCode="normal"|"pending_followup"|"escalated";
export type ShiftLogCheckStatus="normal"|"attention";

const entryCodes:readonly ShiftLogEntryCode[]=["routine_check","visitor_flow","delivery_received","equipment_check","maintenance_notice","incident_followup","handoff_pending","other"];
const categories:readonly ShiftLogCategory[]=["access","security","maintenance","utilities","resident_support","delivery","other"];
const severities:readonly ShiftLogSeverity[]=["info","attention","urgent"];
const closureCodes:readonly ShiftLogClosureCode[]=["normal","pending_followup","escalated"];
const checkStatuses:readonly ShiftLogCheckStatus[]=["normal","attention"];

export function isShiftLogEntryCode(value:unknown):value is ShiftLogEntryCode{return typeof value==="string"&&entryCodes.includes(value as ShiftLogEntryCode)}
export function isShiftLogCategory(value:unknown):value is ShiftLogCategory{return typeof value==="string"&&categories.includes(value as ShiftLogCategory)}
export function isShiftLogSeverity(value:unknown):value is ShiftLogSeverity{return typeof value==="string"&&severities.includes(value as ShiftLogSeverity)}
export function isShiftLogClosureCode(value:unknown):value is ShiftLogClosureCode{return typeof value==="string"&&closureCodes.includes(value as ShiftLogClosureCode)}
export function isShiftLogCheckStatus(value:unknown):value is ShiftLogCheckStatus{return typeof value==="string"&&checkStatuses.includes(value as ShiftLogCheckStatus)}
export function isPendingCount(value:unknown):value is number{return typeof value==="number"&&Number.isInteger(value)&&value>=0&&value<=99}
export function isCaseReference(value:unknown):value is string{return typeof value==="string"&&value.length>=1&&value.length<=80&&/^[A-Za-z0-9._-]+$/.test(value)}
export function isServiceDate(value:unknown):value is string{
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+"T00:00:00Z");
 return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
export function santiagoServiceDate(now=new Date()):string{
 return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
}
