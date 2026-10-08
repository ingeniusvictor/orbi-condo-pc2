"use client";
import {useState,type FormEvent} from "react";
import {validateProof,validateUnit} from "../lib/payment-proof";
export default function OrbiPay(){
 const [unit,setUnit]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [error,setError]=useState("");
 const [ready,setReady]=useState(false);
 function review(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  const issue=validateUnit(unit)||validateProof(file);
  if(issue){setError(issue);setReady(false);return;}
  setError("");setReady(true);
 }
 return <section id="orbi-pay" aria-labelledby="pay-title" style={{padding:"clamp(32px,6vw,90px) 6%",background:"#0b1d26",color:"#f1fffd"}}>
  <div style={{maxWidth:920,margin:"auto"}}>
   <p style={{letterSpacing:3,color:"#64e9db",fontWeight:700}}>ORBI PAY · PRÓXIMAMENTE</p>
   <h2 id="pay-title" style={{fontSize:"clamp(2rem,5vw,3.5rem)",margin:"12px 0"}}>Tu comprobante, sin complicaciones.</h2>
   <p style={{maxWidth:650,lineHeight:1.6}}>Prepara tu comprobante desde el teléfono o computador. Esta versión permite revisar el archivo, pero <strong>todavía no lo envía a la administración</strong>.</p>
   <form onSubmit={review} style={{display:"grid",gap:16,maxWidth:530,marginTop:24}}>
    <label htmlFor="pay-unit">Número de departamento</label>
    <input id="pay-unit" value={unit} onChange={e=>{setUnit(e.target.value);setReady(false)}} placeholder="Ej. 1204" maxLength={20} autoComplete="off" required style={{padding:14,borderRadius:10,color:"#10222c",background:"#fff"}}/>
    <label htmlFor="pay-proof">Comprobante de transferencia (JPG, PNG, WEBP o PDF; máximo 5 MB)</label>
    <input id="pay-proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>{setFile(e.target.files?.[0]??null);setReady(false)}} required style={{padding:14,border:"1px solid #54757c",borderRadius:10}}/>
    {error&&<p role="alert" style={{color:"#ffb5b5"}}>{error}</p>}
    <button type="submit" style={{background:"#64e9db",color:"#08222c",border:0,borderRadius:10,padding:16,fontWeight:800,cursor:"pointer"}}>Revisar comprobante</button>
    {ready&&<div role="status" style={{padding:16,border:"1px solid #64e9db",borderRadius:10}}>Archivo validado para departamento {unit.trim()}: {file?.name}. <strong>No se ha enviado ni registrado un pago.</strong> El envío seguro se habilitará cuando estén listos los accesos y la configuración administrativa.</div>}
   </form>
  </div>
 </section>;
}
