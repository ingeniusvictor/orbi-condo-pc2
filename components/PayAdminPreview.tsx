"use client";
import {useState} from "react";
import {validatePaymentConfig} from "../lib/pay-config";
export default function PayAdminPreview(){
 const [recipient,setRecipient]=useState("");
 const [administration,setAdministration]=useState("");
 const [bank,setBank]=useState("");
 const [holder,setHolder]=useState("");
 const [account,setAccount]=useState("");
 const [type,setType]=useState("");
 const [message,setMessage]=useState("");
 function review(){
  const errors=validatePaymentConfig({recipientEmail:recipient,administrationName:administration,bankName:bank,accountHolder:holder,accountNumber:account,accountType:type});
  setMessage(errors.length?errors.join(" "):"Propuesta válida para revisión. No se ha guardado, enviado ni activado ningún cambio.");
 }
 return <section id="pay-admin" style={{padding:"clamp(32px,6vw,90px) 6%",background:"#f4f7f7",color:"#0a222b"}}>
  <div style={{maxWidth:940,margin:"auto"}}>
   <p style={{color:"#176b72",fontWeight:800,letterSpacing:2}}>ORBI ADMIN · CONFIGURACIÓN DE PAGOS</p>
   <h2 style={{fontSize:"clamp(1.8rem,4vw,3rem)",margin:"12px 0"}}>Una administración que tiene el control.</h2>
   <p style={{maxWidth:720,lineHeight:1.6}}>Vista previa de los datos que podrá gestionar el administrador. No contiene datos bancarios reales, no almacena información y no activa destinatarios. Los cambios sensibles requerirán revisión del comité, verificación del correo y ejecución final del administrador.</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))",gap:16,marginTop:20}}>
    {([{id:"pay-admin-email",label:"Correo receptor de comprobantes",value:recipient,set:setRecipient,type:"email"},{id:"pay-admin-name",label:"Empresa administradora",value:administration,set:setAdministration,type:"text"},{id:"pay-admin-bank",label:"Banco",value:bank,set:setBank,type:"text"},{id:"pay-admin-holder",label:"Titular de la cuenta",value:holder,set:setHolder,type:"text"},{id:"pay-admin-number",label:"Número de cuenta",value:account,set:setAccount,type:"text"},{id:"pay-admin-type",label:"Tipo de cuenta",value:type,set:setType,type:"text"}] as const).map(field=><div key={field.id} style={{display:"grid",gap:7}}><label htmlFor={field.id}>{field.label}</label><input id={field.id} type={field.type} value={field.value} onChange={e=>{field.set(e.target.value);setMessage("")}} maxLength={254} style={{padding:12,border:"1px solid #94b3b7",borderRadius:9,background:"#fff",color:"#10222c"}}/></div>)}
   </div>
   <button type="button" onClick={review} style={{marginTop:22,padding:"14px 24px",background:"#0a3440",color:"#fff",border:0,borderRadius:9,cursor:"pointer"}}>Revisar propuesta (demo)</button>
   {message&&<p role="status" style={{marginTop:14}}>{message}</p>}
  </div>
 </section>;
}
