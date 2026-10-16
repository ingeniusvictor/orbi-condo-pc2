import type {Instrumentation} from "next";

const REQUEST_ID_HEADER="x-orbi-request-id";
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_METHODS=new Set(["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"]);
const SAFE_ROUTE=/^\/api\/(?:auth|operations)(?:\/[a-z0-9_\-\[\]]+)*$/;

function normalizeRoute(routePath:string){
 const normalized=routePath
  .replace(/^\/app(?=\/)/,"")
  .replace(/\/route$/,"");
 return SAFE_ROUTE.test(normalized)?normalized:null;
}

function normalizeRequestId(value:string|string[]|undefined){
 const candidate=Array.isArray(value)?value[0]:value;
 return candidate&&UUID_PATTERN.test(candidate)?candidate:"unavailable";
}

function normalizeMethod(method:string){
 const candidate=method.toUpperCase();
 return SAFE_METHODS.has(candidate)?candidate:"OTHER";
}

export const onRequestError:Instrumentation.onRequestError=async(
 _error,
 request,
 context,
)=>{
 const route=normalizeRoute(context.routePath);
 if(!route)return;

 const entry={
  event:"orbi.private.unhandled_error",
  requestId:normalizeRequestId(request.headers[REQUEST_ID_HEADER]),
  method:normalizeMethod(request.method),
  route,
  routeType:context.routeType,
 };

 // Deliberately omit error messages/stacks, request.path, query strings,
 // bodies, cookies, Authorization values, IPs, user agents and identities.
 console.error(JSON.stringify(entry));
};
