"use client";

import {useEffect,useState} from "react";
import {privateApiPath,safeRequestReference,shouldExposeFailureReference} from "@/lib/client-request-reference";

export default function PrivateApiFailureReference(){
 const [reference,setReference]=useState<string|null>(null);

 useEffect(()=>{
  const previousFetch=window.fetch;
  const wrappedFetch:typeof window.fetch=async(...args)=>{
   const response=await previousFetch(...args);
   const pathname=privateApiPath(args[0]);
   if(shouldExposeFailureReference(pathname,response.status)){
    const next=safeRequestReference(response.headers.get("x-orbi-request-id"));
    if(next)setReference(next);
   }
   return response;
  };
  window.fetch=wrappedFetch;
  return ()=>{if(window.fetch===wrappedFetch)window.fetch=previousFetch;};
 },[]);

 if(!reference)return null;
 return <aside role="status" aria-live="polite" style={{position:"fixed",right:16,bottom:16,zIndex:1000,maxWidth:420,background:"#0b2432",border:"1px solid #47798b",borderRadius:14,padding:14,boxShadow:"0 18px 42px rgba(0,0,0,.35)",color:"#eaffff",fontFamily:"system-ui,sans-serif"}}>
  <strong style={{display:"block",marginBottom:6}}>Referencia técnica disponible</strong>
  <span style={{display:"block",fontSize:13,lineHeight:1.5,color:"#b7d1db"}}>Si necesitas soporte, indica únicamente esta referencia. No copies contraseñas, datos personales ni contenido privado.</span>
  <code style={{display:"block",marginTop:8,wordBreak:"break-all",fontSize:12,color:"#8ce9e4"}}>{reference}</code>
  <button type="button" onClick={()=>setReference(null)} style={{marginTop:10,minHeight:36,borderRadius:9,border:"1px solid #47798b",background:"#123b4a",color:"#efffff",padding:"6px 10px",fontWeight:700,cursor:"pointer"}}>Cerrar</button>
 </aside>;
}
