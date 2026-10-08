import "server-only";
import {cookies} from "next/headers";
const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_ANON_KEY;
export const configured=Boolean(url&&key);
export type Role="administrator"|"committee"|"resident";
/** Reject cross-site cookie-authenticated writes, including form submissions. */
export function trustedOrigin(req:Request){
 const origin=req.headers.get("origin");
 const expected=new URL(req.url).origin;
 return origin===expected;
}
export type Identity={id:string;role:Role;accessToken:string};
export function backendConfig(){if(!url||!key)throw new Error("Backend no configurado");return {url,key}}
export async function authenticate():Promise<Identity|null>{
 if(!configured)return null;
 const token=(await cookies()).get("orbi_session")?.value;
 if(!token)return null;
 const {url,key}=backendConfig();
 const userResponse=await fetch(url+"/auth/v1/user",{headers:{apikey:key,Authorization:"Bearer "+token},cache:"no-store"});
 if(!userResponse.ok)return null;
 const user=await userResponse.json() as {id?:string};
 if(!user.id)return null;
 const memberResponse=await fetch(url+"/rest/v1/community_members?select=role&user_id=eq."+encodeURIComponent(user.id)+"&community_id=eq.pc2&limit=1",{headers:{apikey:key,Authorization:"Bearer "+token},cache:"no-store"});
 if(!memberResponse.ok)return null;
 const members=await memberResponse.json() as Array<{role:Role}>;
 const role=members[0]?.role;
 if(!["administrator","committee","resident"].includes(role))return null;
 return {id:user.id,role,accessToken:token};
}
export async function dbFetch(path:string,identity:Identity,init:RequestInit={}){
 const {url,key}=backendConfig();
 return fetch(url+"/rest/v1/"+path,{...init,headers:{apikey:key,Authorization:"Bearer "+identity.accessToken,...init.headers},cache:"no-store"});
}
