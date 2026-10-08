"use client";
import {useMemo,useState} from "react";
import {financeCsvTemplate,parseFinanceCsv} from "../lib/finance-import";
const pesos=(n:number)=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
export default function FinanceImportPreview(){
 const [open,setOpen]=useState(false),[period,setPeriod]=useState("2026-09"),[total,setTotal]=useState("17493734"),[csv,setCsv]=useState("");
 const [filename,setFilename]=useState("");
 const preview=useMemo(()=>csv.trim()?parseFinanceCsv(csv,period,Number(total)):null,[csv,period,total]);
 const inputStyle={background:"#102b38",color:"#eefaff",border:"1px solid #386773",borderRadius:8,padding:12,maxWidth:"100%"};
 return <section aria-label="Revisión de importaciones financieras" style={{padding:"28px clamp(24px,5vw,72px)",background:"#081e2a",color:"#eefaff",borderTop:"1px solid #204553"}}>
 <button type="button" onClick={()=>setOpen(x=>!x)} aria-expanded={open} style={{background:"#164b54",border:"1px solid #58cabb",color:"#fff",padding:"12px 20px",borderRadius:10,cursor:"pointer"}}>{open?"Cerrar revisión de importación":"Laboratorio de importación financiera (CSV)"}</button>
 {open&&<div style={{maxWidth:900,marginTop:20}}>
  <h3 style={{fontSize:25}}>Vista previa de conciliación</h3>
  <p style={{lineHeight:1.6}}>Herramienta experimental local para CSV sin información personal. No envía archivos, no guarda datos y no publica movimientos. Los PDF originales deberán procesarse en un futuro flujo privado con revisión de administración.</p>
  <p><button type="button" onClick={()=>{setCsv(financeCsvTemplate);setFilename("Ejemplo incorporado")}} style={{...inputStyle,cursor:"pointer"}}>Cargar ejemplo ficticio</button></p>
  <div style={{display:"flex",gap:14,flexWrap:"wrap",margin:"18px 0"}}>
   <label>Período<br/><input aria-label="Período contable" value={period} onChange={e=>setPeriod(e.target.value)} style={inputStyle}/></label>
   <label>Total informado (CLP)<br/><input aria-label="Total declarado" inputMode="numeric" value={total} onChange={e=>setTotal(e.target.value)} style={inputStyle}/></label>
   <label>CSV local (sin datos personales)<br/><input type="file" accept=".csv,text/csv,text/plain" style={inputStyle} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>200000){setFilename("Archivo excede 200 KB");setCsv("");return}setCsv(await file.text());setFilename(file.name)}}/></label>
  </div>
  {filename&&<p>Archivo: {filename}</p>}
  <p style={{fontSize:13,color:"#a9c8d0"}}>Columnas: descripcion;proveedor;monto_clp;fecha_pago;numero_documento;categoria;pagina. Usa números enteros sin separador de miles y montos negativos para devoluciones. No cargues nóminas ni documentos con datos personales.</p>
  {preview&&<div aria-live="polite" style={{border:"1px solid #386773",borderRadius:12,padding:18}}>
   <b>{preview.balanced?"Conciliación correcta":"Revisión pendiente: no conciliado"}</b>
   <p>{preview.rows.length} movimientos válidos · {preview.issues.length} observaciones</p>
   <p>Calculado: {pesos(preview.computedTotalClp)} · Declarado: {pesos(preview.statedTotalClp)} · Diferencia: {pesos(preview.differenceClp)}</p>
   {preview.issues.slice(0,12).map((issue,i)=><p key={i} style={{color:"#ffbd9b"}}>Línea {issue.row}: {issue.reason}</p>)}
   <div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}><thead><tr><th>Descripción</th><th>Proveedor</th><th>Pago</th><th>Monto</th></tr></thead><tbody>{preview.rows.slice(0,30).map((r,i)=><tr key={i}><td style={{padding:7}}>{r.description}</td><td style={{padding:7}}>{r.supplierDisplayName}</td><td style={{padding:7}}>{r.paymentDate||"Sin fecha"}</td><td style={{padding:7}}>{pesos(r.amountClp)}</td></tr>)}</tbody></table></div>
   {preview.rows.length>30&&<p>Mostrando los primeros 30 movimientos.</p>}
  </div>}
 </div>}
 </section>
}
