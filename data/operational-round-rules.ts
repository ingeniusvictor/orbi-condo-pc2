export type OperationalRoundType="opening"|"routine"|"exception";
export type OperationalCheckpoint="access_control"|"common_areas"|"safety_equipment"|"utilities"|"perimeter"|"handoff_readiness"|"other";
export type OperationalCheckResult="ok"|"attention"|"not_applicable";

const roundTypes:readonly OperationalRoundType[]=["opening","routine","exception"];
const checkpoints:readonly OperationalCheckpoint[]=["access_control","common_areas","safety_equipment","utilities","perimeter","handoff_readiness","other"];
const results:readonly OperationalCheckResult[]=["ok","attention","not_applicable"];

export function isOperationalRoundType(value:unknown):value is OperationalRoundType{return typeof value==="string"&&roundTypes.includes(value as OperationalRoundType)}
export function isOperationalCheckpoint(value:unknown):value is OperationalCheckpoint{return typeof value==="string"&&checkpoints.includes(value as OperationalCheckpoint)}
export function isOperationalCheckResult(value:unknown):value is OperationalCheckResult{return typeof value==="string"&&results.includes(value as OperationalCheckResult)}
export function isOperationalCaseReference(value:unknown):value is string{return typeof value==="string"&&value.length>=1&&value.length<=80&&/^[A-Za-z0-9._-]+$/.test(value)}
