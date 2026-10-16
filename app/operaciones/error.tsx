"use client";

import type {CSSProperties} from "react";

const SAFE_DIGEST=/^[A-Za-z0-9_-]{1,80}$/;

const panel:CSSProperties={
 maxWidth:720,
 width:"100%",
 boxSizing:"border-box",
 background:"linear-gradient(160deg,rgba(15,43,60,.97),rgba(7,25,38,.97))",
 border:"1px solid #855461",
 borderRadius:20,
 padding:"clamp(22px,5vw,42px)",
 boxShadow:"0 20px 50px rgba(0,0,0,.2)",
};

const button:CSSProperties={
 minHeight:44,
 borderRadius:10,
 border:"1px solid #47798b",
 background:"#164c5a",
 color:"#f3ffff",
 padding:"10px 14px",
 fontWeight:750,
 cursor:"pointer",
};

export default function OperationsError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 const reference=error.digest&&SAFE_DIGEST.test(error.digest)?error.digest:null;

 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"radial-gradient(ellipse at top right,#174a58,#06131f 62%)",color:"#efffff",padding:"clamp(18px,5vw,58px)",fontFamily:"system-ui,sans-serif"}}>
  <section role="alert" aria-live="assertive" style={panel}>
   <p style={{color:"#77e6e1",letterSpacing:2,fontSize:12,margin:"0 0 8px"}}>ORBI LIVING · CONSOLA PRIVADA</p>
   <h1 style={{fontSize:"clamp(30px,5vw,48px)",margin:"0 0 12px"}}>No pudimos completar esta pantalla<span style={{color:"#71e5df"}}>.</span></h1>
   <p style={{color:"#bfd2db",lineHeight:1.7,margin:"0 0 10px"}}>La operación se detuvo de forma segura. Puedes reintentar sin volver a ingresar información sensible.</p>
   {reference&&<p style={{color:"#91adba",fontSize:13,lineHeight:1.6,overflowWrap:"anywhere",margin:"0 0 18px"}}>Referencia técnica: <code>{reference}</code></p>}
   <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:18}}>
    <button type="button" onClick={reset} style={button}>Reintentar</button>
    <a href="/panel-operativo" style={{...button,display:"inline-flex",alignItems:"center",textDecoration:"none",background:"#102f42",borderColor:"#355b70"}}>Volver al panel</a>
   </div>
   <p style={{color:"#829fad",fontSize:12,lineHeight:1.6,margin:"20px 0 0"}}>No copies datos personales, credenciales ni contenido privado al reportar el problema. Si soporte solicita una referencia, comparte únicamente la referencia técnica mostrada arriba.</p>
  </section>
 </main>;
}
