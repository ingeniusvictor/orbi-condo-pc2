"use client";
import {useState} from "react";
import {publishEvidence,reviewEvidence,type EvidenceRecord} from "../lib/evidence-workflow";
const initial:EvidenceRecord={id:"demo-evidence",workOrderId:"DEMO-OT-001",status:"submitted",events:[{id:"demo-0",workOrderId:"DEMO-OT-001",at:"2030-01-01T12:00:00Z",actorId:"demo-contractor-invite",type:"submitted",note:"Entrega ficticia sin archivos"}]};
export default function EvidenceWorkflowDemo(){
 const [record,setRecord]=useState<EvidenceRecord>(initial);
 const [error,setError]=useState("");
 function transition(next:"needs_changes"|"reviewed"|"accepted"|"published"){
  try{const actor={id:"demo-admin",role:"administrator" as const};const at=new Date().toISOString();setRecord(old=>next==="published"?publishEvidence(old,actor,at):reviewEvidence(old,actor,next,"Revisión ilustrativa",at));setError("");}catch(e){setError(e instanceof Error?e.message:"Acción no disponible");}
 }
 return <section aria-labelledby="evidence-flow-title" style={{background:"#edf6f5",color:"#11343d",padding:"clamp(32px,5vw,70px) 6%"}}><div style={{maxWidth:960,margin:"auto"}}>
 <p style={{color:"#176c6e",fontWeight:800,letterSpacing:2}}>ORBI EVIDENCE · FLUJO DE APROBACIÓN · DEMO</p><h2 id="evidence-flow-title" style={{fontSize:"clamp(1.8rem,4vw,3rem)",margin:"10px 0"}}>De la entrega a la publicación.</h2>
 <p>Prueba el circuito de revisión con una orden ficticia. No existe contratista autenticado, almacenamiento, envío de correo ni publicación real.</p>
 <div style={{border:"1px solid #b0cccb",borderRadius:14,padding:20,background:"#fff",marginTop:18}}><strong>DEMO-OT-001 · Ascensores</strong><p>Estado: <b>{record.publishedAt?"PUBLICADA":record.status.toUpperCase()}</b></p>
 <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{([{label:"Solicitar corrección",to:"needs_changes"},{label:"Marcar revisada",to:"reviewed"},{label:"Aceptar trabajo",to:"accepted"},{label:"Publicar evidencia",to:"published"}] as const).map(a=><button key={a.to} onClick={()=>transition(a.to)} style={{padding:"10px 13px",borderRadius:9,border:"1px solid #1b6971",background:a.to==="published"?"#164d56":"#fff",color:a.to==="published"?"#fff":"#164d56",cursor:"pointer"}}>{a.label}</button>)}<button onClick={()=>{setRecord(initial);setError("");}} style={{padding:"10px 13px",borderRadius:9,border:"1px solid #999",background:"#fff",color:"#164d56",cursor:"pointer"}}>Reiniciar demo</button></div>
 {error&&<p role="alert" style={{color:"#a12c2c"}}>{error}</p>}
 <h3>Bitácora ilustrativa</h3><ol>{record.events.map(e=><li key={e.id}>{e.type} · {e.actorId} · {e.note}</li>)}</ol>
 </div></div></section>;
}
