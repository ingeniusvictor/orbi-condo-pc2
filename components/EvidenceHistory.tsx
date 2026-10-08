"use client";
import {PUBLISHED_EVIDENCE_DEMO,visibleEvidenceForSystem} from "../lib/evidence-catalog";
export default function EvidenceHistory({systemName}:{systemName:string}){
 const records=visibleEvidenceForSystem(PUBLISHED_EVIDENCE_DEMO,systemName);
 return <section aria-label={"Evidencias de "+systemName} style={{marginTop:20,padding:16,border:"1px solid #9bc9cb",borderRadius:12}}>
 <p style={{fontWeight:800,letterSpacing:1,margin:"0 0 8px"}}>ORBI EVIDENCE · HISTORIAL</p>
 {records.length?records.map(r=><article key={r.id}><h3>{r.title}</h3><p>{r.performedAt} · {r.provider}</p><p>{r.summary}</p><ul>{r.attachments.map(a=><li key={a.url}><a href={a.url} rel="noreferrer">{a.name}</a></li>)}</ul></article>):<p style={{margin:"0 0 8px"}}>Aún no hay evidencias publicadas para este sistema. Esto no significa que no se hayan realizado trabajos; solo que no existen registros autorizados en esta demostración.</p>}
 <p style={{fontSize:12,opacity:.8,margin:0}}>Solo se mostrarán evidencias aceptadas y publicadas por la administración. No se muestran archivos privados ni entregas pendientes.</p>
 </section>;
}
