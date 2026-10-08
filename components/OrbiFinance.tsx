"use client";
import {useMemo,useState} from "react";
import {september2026Finance as d} from "../data/finance-september-2026";
const pesos=(n:number)=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
export default function OrbiFinance(){
 const [tab,setTab]=useState<"categories"|"suppliers">("categories");
 const rows=useMemo(()=>tab==="categories"?d.categories.map(x=>({name:x.name,amount:x.amount,detail:"details" in x?x.details:""})):d.supplierCosts.map(x=>({name:x.name,amount:x.amount,detail:x.system})),[tab]);
 return <section id="orbi-finance" aria-labelledby="finance-title" style={{padding:"clamp(24px,5vw,72px)",background:"#071722",color:"#eefaff",borderTop:"1px solid #204553"}}>
  <p style={{letterSpacing:".2em",color:"#5de2d2",fontSize:12}}>ORBI LIVING · FINANZAS</p>
  <h2 id="finance-title" style={{fontSize:"clamp(30px,5vw,56px)",margin:"12px 0"}}>ORBI <em style={{color:"#5de2d2"}}>Finance</em></h2>
  <p style={{maxWidth:780,lineHeight:1.7}}>Primer panel de transparencia comunitaria a partir del informe de egresos de {d.period}. Cifras históricas, no saldos bancarios ni información en tiempo real.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,margin:"26px 0"}}>
   {[["Egresos reportados",pesos(d.total)],["Personas con pagos registrados",String(d.workforceRecords)],["Costo laboral agrupado",pesos(440000+6737006+1807326+150000)],["Honorarios administración",pesos(1129781)]].map(([label,value])=><article key={label} style={{background:"#102b38",border:"1px solid #2b5660",borderRadius:15,padding:18}}><small style={{color:"#a6c5ce"}}>{label}</small><strong style={{display:"block",fontSize:"clamp(20px,2.7vw,30px)",marginTop:8}}>{value}</strong></article>)}
  </div>
  <p style={{fontSize:13,color:"#b7d1d8",maxWidth:830}}>La cifra de personal agrupa anticipos, liquidaciones, Previred y un reemplazo de vacaciones. No representa necesariamente costo empleador completo ni confirma dotación contractual. Por privacidad, no se muestran remuneraciones individuales.</p>
  <div style={{display:"flex",gap:10,margin:"28px 0 16px",flexWrap:"wrap"}}>
   <button type="button" onClick={()=>setTab("categories")} aria-pressed={tab==="categories"} style={{padding:"11px 18px",borderRadius:10,border:"1px solid #58cabb",background:tab==="categories"?"#1e736f":"transparent",color:"#fff",cursor:"pointer"}}>Por categoría</button>
   <button type="button" onClick={()=>setTab("suppliers")} aria-pressed={tab==="suppliers"} style={{padding:"11px 18px",borderRadius:10,border:"1px solid #58cabb",background:tab==="suppliers"?"#1e736f":"transparent",color:"#fff",cursor:"pointer"}}>Proveedores destacados</button>
  </div>
  <div style={{display:"grid",gap:10}}>{rows.map(r=><div key={r.name} style={{background:"#102b38",borderRadius:10,padding:"12px 15px"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><b>{r.name}</b><strong>{pesos(r.amount)}</strong></div><div style={{height:5,background:"#284956",borderRadius:8,margin:"10px 0 5px"}}><div style={{width:`${Math.max(0,Math.min(100,r.amount/d.total*100))}%`,height:"100%",background:"#5de2d2",borderRadius:8}}/></div>{r.detail&&<small style={{color:"#a6c5ce"}}>{r.detail}</small>}</div>)}</div>
  <p style={{marginTop:24,fontSize:12,color:"#a6c5ce"}}>Fuente: “Egresos de septiembre - 2026 (Condominio Parque Ciudadano II)”, Comunidad Feliz, páginas 1–3. Importación inicial manual y verificable; no existe sincronización automática con Comunidad Feliz.</p>
 </section>;
}
