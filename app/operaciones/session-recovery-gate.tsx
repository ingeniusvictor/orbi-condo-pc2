"use client";

import {useCallback,useEffect,useState} from "react";
import type {ReactNode} from "react";
import {decideSessionRecovery,isOperationsSessionProbe} from "../../lib/client-session-recovery";

type GateState="checking"|"ready"|"transient";

const shell={minHeight:"100vh",display:"grid",placeItems:"center",background:"radial-gradient(ellipse at top right,#174a58,#06131f 62%)",color:"#efffff",padding:"clamp(18px,5vw,58px)",fontFamily:"system-ui,sans-serif"} as const;
const panel={maxWidth:720,background:"linear-gradient(160deg,rgba(15,43,60,.96),rgba(7,25,38,.96))",border:"1px solid #31576c",borderRadius:20,padding:"clamp(22px,5vw,42px)",boxShadow:"0 20px 50px rgba(0,0,0,.18)"} as const;
const button={minHeight:42,borderRadius:10,border:"1px solid #47798b",background:"#164c5a",color:"#f3ffff",padding:"9px 13px",fontWeight:750,cursor:"pointer"} as const;

export default function SessionRecoveryGate({children}:{children:ReactNode}){
 const [gate,setGate]=useState<GateState>("checking");

 const verify=useCallback(async()=>{
  setGate("checking");
  try{
   const sessionResponse=await fetch("/api/auth/session",{cache:"no-store"});
   if(!sessionResponse.ok){setGate("transient");return;}
   const payload:unknown=await sessionResponse.json().catch(()=>null);
   if(!isOperationsSessionProbe(payload)){setGate("transient");return;}
   const initial=decideSessionRecovery(payload);
   if(initial.kind==="ready"||initial.kind==="backend-unconfigured"){
    setGate("ready");
    return;
   }
   const refresh=await fetch("/api/auth/refresh",{method:"POST",cache:"no-store"});
   const afterRefresh=decideSessionRecovery(payload,refresh.status);
   setGate(afterRefresh.kind==="ready"||afterRefresh.kind==="login"?"ready":"transient");
  }catch{
   setGate("transient");
  }
 },[]);

 useEffect(()=>{void verify();},[verify]);

 if(gate==="ready")return children;
 if(gate==="checking")return <main style={shell}><p role="status">Validando sesión privada…</p></main>;
 return <main style={shell}><section style={panel} aria-live="polite"><p style={{color:"#77e6e1",letterSpacing:2,fontSize:12}}>ORBI LIVING · SESIÓN PRIVADA</p><h1 style={{fontSize:"clamp(32px,6vw,52px)",margin:"8px 0 12px"}}>Validación temporalmente no disponible<span style={{color:"#71e5df"}}>.</span></h1><p style={{color:"#b7ced8",lineHeight:1.65}}>No pudimos confirmar ni renovar la sesión en este momento. Este resultado temporal no se interpreta como un cierre de sesión ni habilita acceso operativo.</p><p style={{color:"#91adba",fontSize:13,lineHeight:1.6}}>La consola, sus permisos y sus datos permanecen ocultos hasta que el servidor vuelva a confirmar la identidad. Puedes reintentar de forma manual.</p><button type="button" onClick={()=>void verify()} style={button}>Reintentar validación</button></section></main>;
}
