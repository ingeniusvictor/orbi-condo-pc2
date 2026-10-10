import "server-only";
import {cookies} from "next/headers";
import type {OperationsRole} from "../../data/operations-types";
import {proposedPermission,proposedPermissionsFor,type OperationPermission} from "../../data/operations-permissions";

const url=process.env.SUPABASE_URL;
const anonKey=process.env.SUPABASE_ANON_KEY;
const communityId=(process.env.ORBI_COMMUNITY_ID||"pc2").trim();
const UPSTREAM_TIMEOUT_MS=10_000;
export const operationsBackendConfigured=Boolean(url&&anonKey&&communityId);
export const OPERATIONS_SESSION_COOKIE="orbi_session";
export const OPERATIONS_REFRESH_COOKIE="orbi_refresh";
const allowedRoles:readonly OperationsRole[]=["administrator","committee","concierge","mayordomo","resident"];

export type OperationsIdentity={
 id:string;
 role:OperationsRole;
 communityId:string;
 accessToken:string;
};

type MembershipRow={
 operations_role?:unknown;
 active_from?:unknown;
 active_until?:unknown;
 disabled_at?:unknown;
};

export function trustedOrigin(req:Request):boolean{
 const origin=req.headers.get("origin");
 if(!origin)return false;
 try{return origin===new URL(req.url).origin;}catch{return false;}
}

export function operationsBackendConfig(){
 if(!url||!anonKey||!communityId)throw new Error("Backend de operaciones no configurado");
 return {url,anonKey,communityId};
}

export async function operationsAuthFetch(path:string,init:RequestInit={}){
 const {url,anonKey}=operationsBackendConfig();
 const cleanPath=path.replace(/^\/+/,"");
 return fetch(url+"/auth/v1/"+cleanPath,{
  ...init,
  headers:{apikey:anonKey,...init.headers},
  cache:"no-store",
  signal:init.signal??AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
 });
}

function roleFrom(value:unknown):OperationsRole|null{
 return typeof value==="string"&&allowedRoles.includes(value as OperationsRole)?value as OperationsRole:null;
}

function membershipActive(row:MembershipRow,now=new Date()):boolean{
 if(typeof row.disabled_at==="string"&&row.disabled_at)return false;
 const nowMs=now.getTime();
 if(typeof row.active_from==="string"&&row.active_from){const start=Date.parse(row.active_from);if(Number.isFinite(start)&&nowMs<start)return false;}
 if(typeof row.active_until==="string"&&row.active_until){const end=Date.parse(row.active_until);if(Number.isFinite(end)&&nowMs>end)return false;}
 return true;
}

export async function authenticateOperations():Promise<OperationsIdentity|null>{
 if(!operationsBackendConfigured)return null;
 const token=(await cookies()).get(OPERATIONS_SESSION_COOKIE)?.value;
 if(!token)return null;
 const {url,anonKey,communityId}=operationsBackendConfig();
 let userResponse:Response;
 try{
  userResponse=await operationsAuthFetch("user",{headers:{Authorization:"Bearer "+token}});
 }catch{return null;}
 if(!userResponse.ok)return null;
 const user=await userResponse.json() as {id?:unknown};
 if(typeof user.id!=="string"||!user.id)return null;
 const membershipPath="/rest/v1/memberships?select=operations_role,active_from,active_until,disabled_at&user_id=eq."+encodeURIComponent(user.id)+"&community_id=eq."+encodeURIComponent(communityId)+"&limit=1";
 let memberResponse:Response;
 try{
  memberResponse=await fetch(url+membershipPath,{headers:{apikey:anonKey,Authorization:"Bearer "+token},cache:"no-store",signal:AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)});
 }catch{return null;}
 if(!memberResponse.ok)return null;
 const rows=await memberResponse.json() as MembershipRow[];
 const membership=rows[0];
 if(!membership||!membershipActive(membership))return null;
 const role=roleFrom(membership.operations_role);
 if(!role)return null;
 return {id:user.id,role,communityId,accessToken:token};
}

export async function requireOperationPermission(permission:OperationPermission):Promise<OperationsIdentity|null>{
 const identity=await authenticateOperations();
 if(!identity||!proposedPermission(identity.role,permission))return null;
 return identity;
}

export function permissionsForIdentity(identity:OperationsIdentity):readonly OperationPermission[]{
 return proposedPermissionsFor(identity.role);
}

export async function operationsDbFetch(path:string,identity:OperationsIdentity,init:RequestInit={}){
 const {url,anonKey}=operationsBackendConfig();
 const cleanPath=path.replace(/^\/+/,"");
 return fetch(url+"/rest/v1/"+cleanPath,{
  ...init,
  headers:{apikey:anonKey,Authorization:"Bearer "+identity.accessToken,...init.headers},
  cache:"no-store",
  signal:init.signal??AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
 });
}
