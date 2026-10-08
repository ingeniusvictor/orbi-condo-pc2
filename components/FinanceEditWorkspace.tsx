"use client";
import {useMemo,useState} from "react";
import {august2026Finance} from "../data/finance-august-2026";
import {september2026Finance} from "../data/finance-september-2026";

type Row={id:string;category:string;amount:number;note:string};
const seed=(period:"2026-08"|"2026-09"):Row[]=>(period==="2026-08"?august2026Finance.categories:september2026Finance.categories).map((x,i)=>({id:String(i+1),category:x.name,amount:x.amount,note:"details" in x?String(x.details):""}));
const totals={"2026-08":august2026Finance.total,"2026-09":september2026Finance.total};
const pesos=(v:number)=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(v);
const inputStyle={background:"#102c39",border:"1px solid #4b7780",borderRadius:8,padding:"10px 12px",color:"#f3ffff",width:"100%",minWidth:0};
export default function FinanceEditWorkspace(){
 const [open,setOpen]=useState(false);
 const [period,setPeriod]=useState<"2026-08"|"2026-09">("2026-08");
 const [drafts,setDrafts]=useState<Record<string,Row[]>>({});
 const [note,setNote]=useState("");
 const rows=drafts[period]??seed(period);
 const total=useMemo(()=>rows.reduce((n,r)=>n+r.amount,0),[rows]);
 const difference=total-totals[period];
 const dirty=Object.hasOwn(drafts,period);
 const update=(id:string,field:"category"|"amount"|"note",value:string)=>{
  setDrafts(prev=>({...prev,[period]:(prev[period]??seed(period)).map(r=>r.id===id?{...r,[field]:field==="amount"?Number(value):value}:r)}));
 };
 const add=()=>setDrafts(prev=>({...prev,[period]:[...(prev[period]??seed(period)),{id:"draft-"+Date.now().toString(),category:"Nuevo concepto",amount:0,note:"Pendiente de revisión"}]}));
 const remove=(id:string)=>setDrafts(prev=>({...prev,[period]:(prev[period]??seed(period)).filter(r=>r.id!==id)}));
 const download=()=>{
  const payload={schema:"orbi-finance-review-v1",period,sourceTotalClp:totals[period],draftTotalClp:total,differenceClp:difference,reviewNote:note,rows};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="orbi-finance-borrador-"+period+".json";a.click();URL.revokeObjectURL(url);
 };
 return <section id="finance-editor" aria-label="Laboratorio de edición financiera" style={{padding:"28px clamp(24px,5vw,72px)",background:"#0a1b28",color:"#f1fcff",borderTop:"1px solid #2b5360"}}>
  <button type="button" onClick={()=>setOpen(x=>!x)} aria-expanded={open} style={{padding:"13px 19px",background:"#17515b",color:"#fff",border:"1px solid #6ce0d1",borderRadius:10,cursor:"pointer"}}>{open?"Cerrar editor de prueba":"Abrir editor financiero de prueba"}</button>
  {open&&<div style={{maxWidth:1050,marginTop:24}}>
   <h2 style={{fontSize:"clamp(24px,4vw,40px)",margin:"8px 0"}}>Editor de categorías y montos</h2>
   <p style={{lineHeight:1.7,maxWidth:850}}>Prototipo de edición local: los cambios no se guardan en servidores ni modifican los gastos comunes oficiales. Este panel utiliza exclusivamente cifras agregadas, sin nombres de trabajadores, residentes ni datos bancarios. No introduzcas información privada.</p>
   <div style={{padding:15,border:"1px solid #547582",borderRadius:12,background:"#112f3b",margin:"18px 0"}}><strong>Sin inicio de sesión ni publicación</strong><p style={{margin:"7px 0 0",fontSize:13}}>Cualquier visitante puede abrir este laboratorio. Los borradores solo viven en la memoria de esta pestaña y se pierden al recargar, salvo que exportes una copia JSON.</p></div>
   <label style={{display:"block",maxWidth:260,marginBottom:18}}>Período<br/><select value={period} onChange={e=>setPeriod(e.target.value as "2026-08"|"2026-09")} style={inputStyle}><option value="2026-08">Agosto 2026</option><option value="2026-09">Septiembre 2026</option></select></label>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:20}}>
    {[["Total del documento",pesos(totals[period])],["Total del borrador",pesos(total)],["Diferencia",pesos(difference)]].map(([label,value])=><div key={label} style={{background:"#123442",padding:15,borderRadius:12}}><small>{label}</small><strong style={{display:"block",fontSize:23,marginTop:7}}>{value}</strong></div>)}
   </div>
   <p role="status" style={{color:difference===0?"#9ce6d6":"#ffcb9e"}}>{difference===0?"Totales conciliados; esto no constituye aprobación.":"Diferencia con el documento original: revisión obligatoria."}</p>
   <div style={{display:"grid",gap:12,marginTop:18}}>
    {rows.map((r,i)=><div key={r.id} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10,padding:14,background:"#102d3a",borderRadius:12}}>
     <label>Concepto {i+1}<input aria-label={"Concepto "+(i+1)} value={r.category} maxLength={100} onChange={e=>update(r.id,"category",e.target.value)} style={inputStyle}/></label>
     <label>Monto CLP<input aria-label={"Monto "+(i+1)} type="number" step="1" value={r.amount} onChange={e=>update(r.id,"amount",e.target.value)} style={inputStyle}/></label>
     <label>Observación<input aria-label={"Observación "+(i+1)} value={r.note} maxLength={250} onChange={e=>update(r.id,"note",e.target.value)} style={inputStyle}/></label>
     <button type="button" onClick={()=>remove(r.id)} aria-label={"Quitar concepto "+(i+1)} style={{alignSelf:"end",padding:12,background:"#532d34",color:"white",border:"1px solid #9d5966",borderRadius:8,cursor:"pointer"}}>Quitar</button>
    </div>)}
   </div>
   <label style={{display:"block",margin:"20px 0",maxWidth:700}}>Motivo de la revisión<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500} rows={3} style={inputStyle} placeholder="Describe el motivo de los cambios; no incluyas datos personales"/></label>
   <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
    <button type="button" onClick={add} style={{padding:"12px 16px",borderRadius:9,background:"#1b5660",border:"1px solid #6cdacc",color:"white",cursor:"pointer"}}>Agregar concepto</button>
    <button type="button" disabled={!dirty} onClick={()=>setDrafts(prev=>{const next={...prev};delete next[period];return next})} style={{padding:"12px 16px",borderRadius:9,background:"#203f4a",border:"1px solid #64838b",color:"white",cursor:dirty?"pointer":"not-allowed"}}>Restaurar original</button>
    <button type="button" disabled={!dirty||difference!==0||rows.some(r=>!r.category.trim()||!Number.isSafeInteger(r.amount))||!note.trim()} onClick={download} style={{padding:"12px 16px",borderRadius:9,background:"#18766e",border:"1px solid #73e9d9",color:"white",cursor:"pointer"}}>Exportar borrador conciliado</button>
   </div>
   <p style={{fontSize:12,color:"#b4d0d7",marginTop:18}}>La exportación es un archivo local, no una publicación. Una versión futura deberá registrar usuario autenticado, motivo, versión, evidencia y aprobación del administrador.</p>
  </div>}
 </section>;
}
