export type Role="administrator"|"committee"|"resident";
export type Action="propose_change"|"approve_change"|"apply_change"|"create_survey"|"approve_survey"|"publish_survey"|"respond_survey"|"view_internal";
export type ChangeStatus="draft"|"pending_committee"|"approved"|"rejected"|"applied";
export type ChangeRequest={id:string;communityId:string;createdBy:string;status:ChangeStatus;kind:"provider"|"schedule"|"maintenance"|"document";reason:string;approvedBy?:string};
export function can(role:Role,action:Action):boolean{
 const rules:Record<Action,Role[]>={propose_change:["administrator"],approve_change:["committee"],apply_change:["administrator"],create_survey:["administrator"],approve_survey:["committee"],publish_survey:["administrator"],respond_survey:["resident"],view_internal:["administrator","committee"]};
 return rules[action].includes(role);
}
export function mayApplyChange(role:Role,request:ChangeRequest):boolean{
 return can(role,"apply_change")&&request.status==="approved"&&Boolean(request.approvedBy)&&request.approvedBy!==request.createdBy;
}
export function mayApproveChange(role:Role,request:ChangeRequest,actorId:string):boolean{
 return can(role,"approve_change")&&request.status==="pending_committee"&&request.createdBy!==actorId;
}
/** This is a domain-policy helper, not server authentication or authorization. */
