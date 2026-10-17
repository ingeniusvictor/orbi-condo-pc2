"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

type SessionState={authenticated:boolean;permissions:string[]};

export default function ParkingAdminNav(){
 const [allowed,setAllowed]=useState(false);
 useEffect(()=>{void (async()=>{try{const response=await fetch("/api/auth/session",{cache:"no-store"});if(!response.ok)return;const session=await response.json() as SessionState;setAllowed(Boolean(session.authenticated&&session.permissions.includes("manage_parking")));}catch{}})();},[]);
 if(!allowed)return null;
 return <nav aria-label="Herramientas administrativas de estacionamientos" style={{position:"fixed",right:24,bottom:24,zIndex:50}}><Link href="/operaciones/estacionamientos/historial" style={{display:"inline-block",padding:"11px 14px",borderRadius:12,border:"1px solid rgba(99,222,206,.35)",background:"#0a2023",color:"#dffcf7",textDecoration:"none",fontSize:12,fontWeight:800,boxShadow:"0 12px 30px rgba(0,0,0,.28)"}}>Historial admin</Link></nav>;
}
