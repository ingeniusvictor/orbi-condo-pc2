"use client";
import {useState} from "react";
import {august2026Finance as a} from "../data/finance-august-2026";
import {september2026Finance as s} from "../data/finance-september-2026";
const pesos=(n:number)=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
const rows=[
 {label:"Egresos reportados",aug:a.total,sep:s.total},
 {label:"Administración externa · Becza",aug:a.externalAdministrationFee,sep:1129781},
 {label:"Electricidad",aug:2104300,sep:1945000},
 {label:"Agua",aug:200180,sep:83470},
 {label:"Mantención",aug:1483067,sep:1316181},
 {label:"Plataforma Comunidad Feliz",aug:62087,sep:62087}
];
export default function FinanceMonthlyComparison(){
 const [expanded,setExpanded]=useState(false);
 return <section id="finance-comparison" style={{padding:"clamp(24px,5vw,72px)",background:"#0b2330",color:"#f0fcff",borderTop:"1px solid #26515b"}}>
  <p style={{color:"#72e3d3",letterSpacing:".15em",fontSize:12}}>ORBI LIVING · EVOLUCIÓN FINANCIERA</p>
  <h2 style={{fontSize:"clamp(28px,4vw,48px)",margin:"12px 0"}}>Agosto vs. septiembre 2026</h2>
  <p style={{maxWidth:780,lineHeight:1.6}}>Comparación histórica de gastos comunitarios reportados. Los honorarios de Becza se normalizan para comparar meses, aunque el informe de agosto los agrupa dentro de Administración.</p>
  <div style={{overflowX:"auto",marginTop:24}}>
   <table style={{width:"100%",borderCollapse:"collapse",minWidth:530,textAlign:"left"}}>
    <thead><tr><th style={{padding:12}}>Concepto</th><th style={{padding:12}}>Agosto</th><th style={{padding:12}}>Septiembre</th><th style={{padding:12}}>Variación</th></tr></thead>
    <tbody>{rows.map(r=><tr key={r.label} style={{borderTop:"1px solid #2b505e"}}><td style={{padding:12}}>{r.label}</td><td style={{padding:12}}>{pesos(r.aug)}</td><td style={{padding:12}}>{pesos(r.sep)}</td><td style={{padding:12,color:r.sep>r.aug?"#ffcb9e":"#8ce5cf"}}>{pesos(r.sep-r.aug)}</td></tr>)}</tbody>
   </table>
  </div>
  <button type="button" onClick={()=>setExpanded(x=>!x)} aria-expanded={expanded} style={{marginTop:24,padding:"12px 18px",background:"#174a57",border:"1px solid #5cd1c2",borderRadius:10,color:"white",cursor:"pointer"}}>{expanded?"Ocultar información de fondos":"Ver información del fondo de reserva"}</button>
  {expanded&&<div style={{marginTop:15,padding:18,border:"1px solid #32616b",borderRadius:12,maxWidth:700}}>
   <p>Fondo de reserva cobrado en agosto: <strong>{pesos(a.reserveFundCollected)}</strong></p>
   <p>Saldo informado del fondo en agosto: <strong>{pesos(a.reserveFundReportedBalance)}</strong></p>
   <small style={{color:"#b7d0d7"}}>Datos del documento de agosto, página 2. No son saldos bancarios en tiempo real. No se ha verificado la conciliación bancaria.</small>
  </div>}
  <p style={{marginTop:20,fontSize:12,color:"#afcbd2"}}>Fuentes: Comunidad Feliz, liquidación agosto 2026 (página 2) y detalle de egresos septiembre 2026 (páginas 1–3). No se publican identificadores de unidades ni datos personales.</p>
 </section>
