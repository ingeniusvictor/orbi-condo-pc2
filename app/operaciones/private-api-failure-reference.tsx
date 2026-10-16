"use client";

import {useEffect,useRef,useState} from "react";
import {isAmbiguousMutationFailure,privateApiMethod,privateApiPath,safeRequestReference,shouldExposeFailureReference} from "../../lib/client-request-reference";

type PendingIncidentRequest={body:string;key:string};

export default function PrivateApiFailureReference(){
 const [reference,setReference]=useState<string|null>(null);
 const [ambiguous,setAmbiguous]=useState(false);
 const pendingIncident=useRef<PendingIncidentRequest|null>(null);

 useEffect(()=>{
  const previousFetch=window.fetch;
  const wrappedFetch:typeof window.fetch=async(...args)=>{
   const pathname=privateApiPath(args[0]);
   const method=privateApiMethod(args[0],args[1]);
   const incidentBody=pathname==="/api/operations/incidents/report"&&method==="POST"&&typeof args[1]?.body==="string"?args[1].body:null;
   let requestArgs=args;
   let incidentCreate=false;

   if(incidentBody!==null){
    incidentCreate=true;
    const current=pendingIncident.current;
    const key=current?.body===incidentBody?current.key:crypto.randomUUID();
    pendingIncident.current={body:incidentBody,key};
    const headers=new Headers(args[1]?.headers);
    headers.set("x-orbi-idempotency-key",key);
    requestArgs=[args[0],{...args[1],headers}] as Parameters<typeof window.fetch>;
   }

   const run=()=>previousFetch(...requestArgs);
   let response:Response;
   let retried=false;
   try{
    response=await run();
   }catch(firstError){
    if(!incidentCreate){
     if(isAmbiguousMutationFailure(pathname,method)){
      setReference(null);
      setAmbiguous(true);
     }
     throw firstError;
    }
    retried=true;
    try{response=await run();}
    catch(secondError){
     setReference(null);
     setAmbiguous(true);
     throw secondError;
    }
   }

   if(incidentCreate&&!retried&&response.status>=500){
    retried=true;
    try{response=await run();}
    catch(secondError){
     setReference(null);
     setAmbiguous(true);
     throw secondError;
    }
   }

   if(incidentCreate&&response.status<500)pendingIncident.current=null;
   if(pathname==="/api/operations/dashboard"&&method==="GET"&&response.ok){
    setAmbiguous(false);
    setReference(null);
   }
   if(isAmbiguousMutationFailure(pathname,method,response.status)){
    setReference(null);
    setAmbiguous(true);
   }
   if(shouldExposeFailureReference(pathname,response.status)){
    const next=safeRequestReference(response.headers.get("x-orbi-request-id"));
    if(next)setReference(next);
   }
   return response;
  };
  window.fetch=wrappedFetch;
  return ()=>{if(window.fetch===wrappedFetch)window.fetch=previousFetch;};
 },[]);

 if(!reference&&!ambiguous)return null;
 return <aside role="status" aria-live="polite" style={{position:"fixed",right:16,bottom:16,zIndex:1000,maxWidth:420,background:ambiguous?"#38292a":"#0b2432",border:`1px solid ${ambiguous?"#9a6a6a":"#47798b"}`,borderRadius:14,padding:14,boxShadow:"0 18px 42px rgba(0,0,0,.35)",color:"#eaffff",fontFamily:"system-ui,sans-serif"}}>
  <strong style={{display:"block",marginBottom:6}}>{ambiguous?"Resultado no confirmado":"Referencia técnica disponible"}</strong>
  {ambiguous?<span style={{display:"block",fontSize:13,lineHeight:1.5,color:"#ffd2d2"}}>No repitas la acción todavía. Actualiza la consola y verifica si el cambio ya quedó registrado. El aviso desaparecerá cuando la consola confirme una lectura nueva.</span>:<span style={{display:"block",fontSize:13,lineHeight:1.5,color:"#b7d1db"}}>Si necesitas soporte, indica únicamente esta referencia. No copies contraseñas, datos personales ni contenido privado.</span>}
  {reference&&<><span style={{display:"block",fontSize:12,lineHeight:1.5,color:"#b7d1db",marginTop:8}}>Referencia técnica:</span><code style={{display:"block",wordBreak:"break-all",fontSize:12,color:"#8ce9e4"}}>{reference}</code></>}
  {!ambiguous&&<button type="button" onClick={()=>setReference(null)} style={{marginTop:10,minHeight:36,borderRadius:9,border:"1px solid #47798b",background:"#123b4a",color:"#efffff",padding:"6px 10px",fontWeight:700,cursor:"pointer"}}>Cerrar</button>}
 </aside>;
}
