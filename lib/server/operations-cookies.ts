import "server-only";
import type {NextResponse} from "next/server";
import {OPERATIONS_REFRESH_COOKIE,OPERATIONS_SESSION_COOKIE} from "./operations-auth";

const cookieBase={
 httpOnly:true,
 secure:process.env.NODE_ENV==="production",
 sameSite:"strict" as const,
 path:"/",
};

export function setOperationsSessionCookie(response:NextResponse,token:string,maxAge:number){
 response.cookies.set(OPERATIONS_SESSION_COOKIE,token,{...cookieBase,maxAge});
}

export function setOperationsRefreshCookie(response:NextResponse,token:string){
 response.cookies.set(OPERATIONS_REFRESH_COOKIE,token,cookieBase);
}

export function clearOperationsSessionCookie(response:NextResponse){
 response.cookies.set(OPERATIONS_SESSION_COOKIE,"",{...cookieBase,maxAge:0});
}

export function clearOperationsCookies(response:NextResponse){
 clearOperationsSessionCookie(response);
 response.cookies.set(OPERATIONS_REFRESH_COOKIE,"",{...cookieBase,maxAge:0});
}
