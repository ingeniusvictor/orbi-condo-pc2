"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

type SessionState={authenticated:boolean;permissions:string[]};

export default function ParkingModuleShortcut(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{let cancelled=false;void fetch("/api/auth/session",{cache:"no-store"}).then(response=>response.json()).then((session:SessionState)=>{if(!cancelled)setVisible(Boolean(session.authenticated&&session.permissions?.includes("lookup_parking")));}).catch(()=>{});return()=>{cancelled=true;};},[]);
 if(!visible)return null;
 return <Link href="/operaciones/estacionamientos" aria-label="Abrir Estacionamientos y Bodegas" style={{position:"fixed",right:18,bottom:96,zIndex:36,textDecoration:"none",padding:"11px 14px",borderRadius:999,border:"1px solid rgba(101,245,223,.3)",background:"rgba(7,32,35,.94)",color:"#dffffa",boxShadow:"0 14px 40px rgba(0,0,0,.34)",backdropFilter:"blur(14px)",fontSize:11,fontWeight:800,letterSpacing:".04em"}}>▦ Estacionamientos</Link>;
}
