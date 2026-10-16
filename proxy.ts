import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

export const ORBI_REQUEST_ID_HEADER="x-orbi-request-id";
const MAX_PRIVATE_MUTATION_BODY_BYTES=8*1024;
const mutatingMethods=new Set(["POST","PUT","PATCH","DELETE"]);

function rejected(requestId:string,status:number,error:string){
 return NextResponse.json({error},{
  status,
  headers:{
   "Cache-Control":"private, no-store",
   [ORBI_REQUEST_ID_HEADER]:requestId,
  },
 });
}

export function proxy(request:NextRequest){
 const requestId=crypto.randomUUID();
 const requestHeaders=new Headers(request.headers);
 // Never trust a client-supplied correlation value. A fresh opaque UUID is
 // generated at the application boundary for every private API request.
 requestHeaders.set(ORBI_REQUEST_ID_HEADER,requestId);

 if(mutatingMethods.has(request.method.toUpperCase())){
  const rawLength=request.headers.get("content-length");
  if(rawLength!==null){
   if(!/^\d+$/.test(rawLength))return rejected(requestId,400,"Solicitud inválida");
   const length=Number(rawLength);
   if(!Number.isSafeInteger(length)||length>MAX_PRIVATE_MUTATION_BODY_BYTES){
    return rejected(requestId,413,"Solicitud demasiado grande");
   }
   if(length>0){
    const contentType=(request.headers.get("content-type")||"").split(";",1)[0].trim().toLowerCase();
    if(contentType!=="application/json")return rejected(requestId,415,"Tipo de contenido no admitido");
   }
  }else{
   const contentType=request.headers.get("content-type");
   if(contentType&&contentType.split(";",1)[0].trim().toLowerCase()!=="application/json"){
    return rejected(requestId,415,"Tipo de contenido no admitido");
   }
  }
 }

 const response=NextResponse.next({
  request:{headers:requestHeaders},
 });
 response.headers.set(ORBI_REQUEST_ID_HEADER,requestId);
 return response;
}

export const config={
 matcher:["/api/auth/:path*","/api/operations/:path*"],
};
