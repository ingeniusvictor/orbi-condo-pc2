export type OperationalFollowupAction="verify_condition"|"coordinate_maintenance"|"monitor_incident"|"recheck_checkpoint"|"handoff_action"|"other";
export type OperationalFollowupCategory="access"|"security"|"maintenance"|"utilities"|"resident_support"|"delivery"|"other";
export type OperationalFollowupPriority="low"|"medium"|"high";
export type OperationalFollowupResolution="completed"|"transferred"|"no_action_required";

const actions:readonly OperationalFollowupAction[]=["verify_condition","coordinate_maintenance","monitor_incident","recheck_checkpoint","handoff_action","other"];
const categories:readonly OperationalFollowupCategory[]=["access","security","maintenance","utilities","resident_support","delivery","other"];
const priorities:readonly OperationalFollowupPriority[]=["low","medium","high"];
const resolutions:readonly OperationalFollowupResolution[]=["completed","transferred","no_action_required"];

export function isOperationalFollowupAction(value:unknown):value is OperationalFollowupAction{return typeof value==="string"&&actions.includes(value as OperationalFollowupAction)}
export function isOperationalFollowupCategory(value:unknown):value is OperationalFollowupCategory{return typeof value==="string"&&categories.includes(value as OperationalFollowupCategory)}
export function isOperationalFollowupPriority(value:unknown):value is OperationalFollowupPriority{return typeof value==="string"&&priorities.includes(value as OperationalFollowupPriority)}
export function isOperationalFollowupResolution(value:unknown):value is OperationalFollowupResolution{return typeof value==="string"&&resolutions.includes(value as OperationalFollowupResolution)}
export function isOperationalFollowupReference(value:unknown):value is string{return typeof value==="string"&&value.length>=1&&value.length<=80&&/^[A-Za-z0-9._-]+$/.test(value)}
