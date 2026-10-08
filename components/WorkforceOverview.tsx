import {workforceRoleSnapshot as d} from "../data/workforce-roles";
export default function WorkforceOverview(){
 return <section id="orbi-workforce" aria-labelledby="workforce-title" style={{padding:"clamp(24px,5vw,72px)",background:"#0a202d",color:"#f0faff",borderTop:"1px solid #234756"}}>
  <p style={{letterSpacing:".2em",fontSize:12,color:"#5de2d2"}}>ORBI LIVING · COMUNIDAD</p>
  <h2 id="workforce-title" style={{fontSize:"clamp(30px,5vw,52px)",margin:"12px 0"}}>Equipo de la comunidad</h2>
  <p style={{lineHeight:1.7,maxWidth:780}}>Distribución de funciones identificadas en el listado de personal compartido. Información referencial, no equivale a una nómina contractual vigente ni acredita turnos de trabajo.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:14,marginTop:24}}>
   {d.roles.map(role=><article key={role.name} style={{background:"#102f3e",border:"1px solid #32636d",borderRadius:16,padding:20}}>
    <strong style={{fontSize:36,color:"#73e8d6"}}>{role.count}</strong>
    <p style={{fontSize:17,margin:"10px 0 0"}}>{role.name}</p>
   </article>)}
  </div>
  <p style={{marginTop:18,fontSize:13,color:"#b0cdd5"}}>Total en listado: {d.totalListed} personas · {d.source}. Los nombres, remuneraciones y otros datos personales no se publican en esta vista.</p>
 </section>;
}
