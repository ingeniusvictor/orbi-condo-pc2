import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

export const ORBI_REQUEST_ID_HEADER="x-orbi-request-id";

export function proxy(request:NextRequest){
 const requestId=crypto.randomUUID();
 const requestHeaders=new Headers(request.headers);
 // Never trust a client-supplied correlation value. A fresh opaque UUID is
 // generated at the application boundary for every private API request.
 requestHeaders.set(ORBI_REQUEST_ID_HEADER,requestId);

 const response=NextResponse.next({
  request:{headers:requestHeaders},
 });
 response.headers.set(ORBI_REQUEST_ID_HEADER,requestId);
 return response;
}

export const config={
 matcher:["/api/auth/:path*","/api/operations/:path*"],
};
