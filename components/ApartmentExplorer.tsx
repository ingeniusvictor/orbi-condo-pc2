"use client";
import {useState} from "react";
import {APARTMENT_FINISHES,APARTMENT_PLAN_SOURCE,APARTMENT_TYPOLOGIES} from "../data/apartment-typologies";
const tour="https://my.matterport.com/show/?m=hMG8ApCXTX7";
const area=(n:number)=>n.toLocaleString("es-CL",{minimumFractionDigits:2,maximumFractionDigits:2});
export default function ApartmentExplorer(){
 const [type,setType]=useState<"C1"|"C2"|"C3">("C1");
 const [showTour,setShowTour]=useState(false);
 const selected=APARTMENT_TYPOLOGIES.find(t=>t.id===type)!;
 return <section id="apartments" aria-labelledby="apartment-title" style={{padding:"clamp(42px,7vw,100px) 6%",background:"linear-gradient(145deg,#071b21,#103b40)",color:"#eafffa"}}>
 <div style={{maxWidth:1160,margin:"auto"}}>
 <p style={{color:"#78e9d5",fontWeight:800,letterSpacing:2,fontSize:12}}>ORBI LIVING · PATRIMONIO DOCUMENTAL</p>
 <h2 id="apartment-title" style={{fontSize:"clamp(2rem,5vw,3.8rem)",margin:"12px 0"}}>Conoce tu hogar.</h2>
 <p style={{maxWidth:820,lineHeight:1.7}}>Explora el recorrido oficial del departamento piloto de exhibición y consulta las tipologías documentadas del condominio. El piloto no se atribuye a una tipología concreta.</p>
 <div style={{border:"1px solid #427b7b",borderRadius:18,overflow:"hidden",marginTop:26,background:"#08191e"}}>
 <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><strong>Departamento piloto · recorrido Matterport</strong><span style={{color:"#a7d0c9"}}>Referencia de exhibición</span></div>
 {showTour?<iframe title="Recorrido oficial Matterport del departamento piloto" src={tour+"&play=1"} allow="fullscreen; xr-spatial-tracking" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy" style={{width:"100%",height:"min(70vh,650px)",minHeight:320,border:0,display:"block"}}/>:<div style={{minHeight:230,display:"grid",placeItems:"center",padding:24,textAlign:"center",background:"radial-gradient(circle,#1c6262,#07191d)"}}><div><p>El visor interactivo se carga desde Matterport solo cuando lo solicitas.</p><button type="button" onClick={()=>setShowTour(true)} style={{padding:"13px 22px",border:0,borderRadius:10,background:"#75e8d3",color:"#07262b",fontWeight:800,cursor:"pointer"}}>Iniciar recorrido 3D</button></div></div>}
 <div style={{padding:"12px 20px",display:"flex",gap:18,flexWrap:"wrap"}}><a href={tour} target="_blank" rel="noopener noreferrer" style={{color:"#8ef8e3",textDecoration:"underline"}}>Abrir en Matterport ↗</a><small style={{color:"#9dc3be"}}>El visor y sus contenidos pertenecen a su titular. La disponibilidad de inserción depende de Matterport y sus permisos.</small></div>
 </div>
 <div style={{marginTop:38}}><h3 style={{fontSize:"clamp(1.5rem,3vw,2.3rem)"}}>Tipologías según plano arquitectónico</h3><p style={{color:"#afc9c8"}}>Lámina {APARTMENT_PLAN_SOURCE.sheet} · versión {APARTMENT_PLAN_SOURCE.version} · {APARTMENT_PLAN_SOURCE.date} · escala {APARTMENT_PLAN_SOURCE.scale}</p>
 <div role="group" aria-label="Seleccionar tipología" style={{display:"flex",gap:10,flexWrap:"wrap"}}>{APARTMENT_TYPOLOGIES.map(t=><button key={t.id} type="button" aria-pressed={type===t.id} onClick={()=>setType(t.id)} style={{padding:"12px 23px",borderRadius:12,border:"1px solid #5eafa5",background:type===t.id?"#77e8d5":"transparent",color:type===t.id?"#092a30":"#d9f7ef",fontWeight:800,cursor:"pointer"}}>Tipo {t.id}</button>)}</div>
 <article style={{marginTop:18,border:"1px solid #427b7b",borderRadius:16,padding:"clamp(18px,4vw,30px)",background:"#102b32"}}>
 <h4 style={{fontSize:24,margin:"0 0 12px"}}>Departamento {selected.id} · {selected.bedrooms} dormitorios · {selected.bathrooms} baños</h4>
 <strong style={{fontSize:32,color:"#88f7e2"}}>{area(selected.totalBuiltM2)} m²</strong><p style={{marginTop:5}}>Superficie total edificada según cuadro de áreas del plano</p>
 <dl style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:15}}>{([{label:"Interior edificado",value:selected.interiorBuiltM2},{label:"Logia 100%",value:selected.loggiaM2},{label:"Superficie interna",value:selected.internalM2},{label:"Terraza computable 50%",value:selected.terraceComputedM2}] as const).map(x=><div key={x.label}><dt style={{color:"#a6c9c6"}}>{x.label}</dt><dd style={{margin:"6px 0",fontWeight:800}}>{area(x.value)} m²</dd></div>)}</dl>
 <p style={{color:"#b3cfcc"}}>{selected.notes}</p></article>
 <details style={{marginTop:18,border:"1px solid #427b7b",borderRadius:12,padding:18}}><summary style={{cursor:"pointer",fontWeight:800}}>Terminaciones y referencias técnicas del plano</summary><ul style={{lineHeight:1.9}}>{APARTMENT_FINISHES.map(x=><li key={x}>{x}</li>)}</ul><p>La lámina también representa puertas, mobiliario referencial, puntos eléctricos y conexiones de agua fría y caliente; no se interpretan como levantamiento actualizado de cada vivienda.</p></details>
 <p style={{fontSize:13,color:"#acc9c5",lineHeight:1.7,marginTop:20}}><strong>Fuente:</strong> {APARTMENT_PLAN_SOURCE.title}. {APARTMENT_PLAN_SOURCE.status}. Las superficies corresponden a criterios de cómputo indicados en la lámina, no a una medición independiente de los departamentos entregados.</p>
 </div></div></section>;
}
