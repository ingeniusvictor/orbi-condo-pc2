"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

const PRIVATE_ROUTE_CLASS="orbi-private-route";
const CONCIERGE_ROUTE_CLASS="orbi-concierge-route";

export default function PrivateOperationsViewport(){
 const pathname=usePathname();
 useEffect(()=>{
  const privateOperations=pathname==="/operaciones";
  const conciergeDaily=pathname==="/conserjeria";
  document.body.classList.toggle(PRIVATE_ROUTE_CLASS,privateOperations);
  document.body.classList.toggle(CONCIERGE_ROUTE_CLASS,conciergeDaily);
  return ()=>{
   document.body.classList.remove(PRIVATE_ROUTE_CLASS);
   document.body.classList.remove(CONCIERGE_ROUTE_CLASS);
  };
 },[pathname]);
 return null;
}
