const REQUEST_ID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function safeRequestReference(value:string|null|undefined){
 const normalized=value?.trim();
 return normalized&&REQUEST_ID_RE.test(normalized)?normalized.toLowerCase():null;
}

export function shouldExposeFailureReference(pathname:string,status:number){
 if(status<400)return false;
 if(pathname.startsWith("/api/operations/"))return status!==401&&status!==403;
 if(pathname.startsWith("/api/auth/"))return status===429||status>=500;
 return false;
}

export function privateApiPath(input:RequestInfo|URL){
 try{
  const raw=typeof input==="string"?input:input instanceof URL?input.href:input.url;
  return new URL(raw,window.location.origin).pathname;
 }catch{return "";}
}

export function privateApiMethod(input:RequestInfo|URL,init?:RequestInit){
 const method=init?.method??(typeof Request!=="undefined"&&input instanceof Request?input.method:"GET");
 return method.toUpperCase();
}

export function isAmbiguousMutationFailure(pathname:string,method:string,status?:number){
 if(!pathname.startsWith("/api/operations/")||method.toUpperCase()!=="POST")return false;
 return status===undefined||status>=500;
}
