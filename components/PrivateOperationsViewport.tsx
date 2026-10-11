"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

const PRIVATE_ROUTE_CLASS="orbi-private-route";

export default function PrivateOperationsViewport(){
 const pathname=usePathname();
 useEffect(()=>{
  const active=pathname==="/operaciones";
  document.body.classList.toggle(PRIVATE_ROUTE_CLASS,active);
  return ()=>document.body.classList.remove(PRIVATE_ROUTE_CLASS);
 },[pathname]);
 return null;
}
