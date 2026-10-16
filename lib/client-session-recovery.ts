export type OperationsSessionProbe={
 configured:boolean;
 authenticated:boolean;
 communityId:string|null;
 role:string|null;
 permissions:string[];
};

export type SessionRecoveryDecision=
 | {kind:"ready"}
 | {kind:"login"}
 | {kind:"backend-unconfigured"}
 | {kind:"refresh"}
 | {kind:"transient"};

export function isOperationsSessionProbe(value:unknown):value is OperationsSessionProbe{
 if(!value||typeof value!=="object")return false;
 const probe=value as Partial<OperationsSessionProbe>;
 return typeof probe.configured==="boolean"
  &&typeof probe.authenticated==="boolean"
  &&(probe.communityId===null||typeof probe.communityId==="string")
  &&(probe.role===null||typeof probe.role==="string")
  &&Array.isArray(probe.permissions)
  &&probe.permissions.every(permission=>typeof permission==="string");
}

export function decideSessionRecovery(session:OperationsSessionProbe,refreshStatus?:number):SessionRecoveryDecision{
 if(!session.configured)return {kind:"backend-unconfigured"};
 if(session.authenticated)return {kind:"ready"};
 if(refreshStatus===undefined)return {kind:"refresh"};
 if(refreshStatus===200)return {kind:"ready"};
 if(refreshStatus===401)return {kind:"login"};
 return {kind:"transient"};
}
