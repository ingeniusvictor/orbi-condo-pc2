"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

type SessionState={authenticated:boolean;permissions:string[]};

export default function ParkingModuleShortcut(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{let cancelled=false;void fetch("/api/auth/session",{cache:"no-store"}).then(response=>response.json()).then((session:SessionState)=>{if(!cancelled)setVisible(Boolean(session.authenticated&&session.permissions?.includes("lookup_parking")));}).catch(()=>{});return()=>{cancelled=true;};},[]);
 if(!visible)return null;
 return <Link href="/operaciones/estacionamientos" aria-label="Abrir Estacionamientos y Bodegas" style={{position:"fixed",right:12,bottom:"max(146px,calc(130px + env(safe-area-inset-bottom)))",zIndex:72,textDecoration:"none",padding:"11px 14px",borderRadius:999,border:"1px solid rgba(101,245,223,.38)",background:"linear-gradient(135deg,rgba(8,86,103,.98),rgba(7,44,55,.98))",color:"#eaffff",boxShadow:"0 16px 42px rgba(0,0,0,.38)",backdropFilter:"blur(14px)",fontSize:11,fontWeight:850,letterSpacing:".04em"}}>▦ Estacionamientos</Link>;
}
