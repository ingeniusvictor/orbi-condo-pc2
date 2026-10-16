import "server-only";
import type {NextResponse} from "next/server";
import {OPERATIONS_REFRESH_COOKIE,OPERATIONS_SESSION_COOKIE} from "./operations-auth";

const cookieSecurity={
 httpOnly:true,
 secure:process.env.NODE_ENV==="production",
 sameSite:"strict" as const,
};

const sessionCookie={...cookieSecurity,path:"/api"};
const refreshCookie={...cookieSecurity,path:"/api/auth"};

export function setOperationsSessionCookie(response:NextResponse,token:string,maxAge:number){
 response.cookies.set(OPERATIONS_SESSION_COOKIE,token,{...sessionCookie,maxAge});
}

export function setOperationsRefreshCookie(response:NextResponse,token:string){
 response.cookies.set(OPERATIONS_REFRESH_COOKIE,token,refreshCookie);
}

export function clearOperationsSessionCookie(response:NextResponse){
 response.cookies.set(OPERATIONS_SESSION_COOKIE,"",{...sessionCookie,maxAge:0});
}

export function clearOperationsCookies(response:NextResponse){
 clearOperationsSessionCookie(response);
 response.cookies.set(OPERATIONS_REFRESH_COOKIE,"",{...refreshCookie,maxAge:0});
}
