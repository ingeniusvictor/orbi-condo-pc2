"use client";
import {useMemo,useState} from "react";
import {AnimatePresence,motion} from "framer-motion";
import BeforeAfter from "../components/BeforeAfter";
import CommunityMap from "../components/CommunityMap";
import SystemIcon from "../components/SystemIcon";
import {community} from "../data/community";

const label:any={scheduled:["PROGRAMADA","warn"],ondemand:["A REQUERIMIENTO","muted"]};
const filters=["Todos","Mensual","Bimensual","Trimestral","Por requerimiento"];
const months=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

export default function Home(){
 const [filter,setFilter]=useState("Todos");
 const [selected,setSelected]=useState<number|null>(null);
 const visible=useMemo(()=>filter==="Todos"?community.systems:community.systems.filter(s=>s.frequency===filter),[filter]);
 const active=selected===null?null:community.systems[selected];
 const monthly=community.systems.filter(s=>s.frequency==="Mensual").length;
 const bimonthly=community.systems.filter(s=>s.frequency==="Bimensual").length;
 const quarterly=community.systems.filter(s=>s.frequency==="Trimestral").length;
 const demand=community.systems.filter(s=>s.status==="ondemand").length;
 const currentMonth=new Date().getMonth();
 return <main>
 <section className="hero"><div className="heroPhoto" aria-hidden="true"/><div className="heroShade" aria-hidden="true"/><div className="orb orb1"/><div className="orb orb2"/><nav><div className="brand"><span className="mark">O</span><span>ORBI <b>CONDO</b></span></div><span className="pilot">EXPERIENCIA PC2 · 2026</span></nav><motion.div className="heroCopy" initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:.8}}><p className="eyebrow">{community.name.toUpperCase()} · {community.city.toUpperCase()}</p><h1>Tu condominio,<br/><em>más claro.</em></h1><p className="lead">Descubre qué se mantiene, quién lo cuida y qué viene después. Toda la información esencial de tu comunidad, transformada en una experiencia que cualquiera puede entender.</p><div className="actions"><a href="#maintenance" className="primary">Explorar mantenciones <span>↓</span></a><span className="live"><i/> Información comunitaria</span></div></motion.div><div className="heroStats"><div><b>{String(community.systems.length).padStart(2,"0")}</b><span>Sistemas</span></div><div><b>{String(community.providers.length).padStart(2,"0")}</b><span>Proveedores</span></div><div><b>{String(community.certifications.length).padStart(2,"0")}</b><span>Certificaciones</span></div><div><b>365</b><span>Días visibles</span></div></div></section>
 
 <section className="identity"><div className="identityPhoto" role="img" aria-label={`Acceso de ${community.name}`}/><div className="identityCopy"><p className="eyebrow">UN LUGAR REAL · UNA EXPERIENCIA NUEVA</p><h2>{community.name},<br/><em>ahora también digital.</em></h2><p>Un condominio de {community.housingCount} viviendas en {community.city}, transformado en el primer concepto ORBI Condo: información cotidiana presentada con claridad, identidad y diseño.</p><div className="identityFacts"><span><b>{community.housingCount}</b> viviendas</span><span><b>{community.housingProgram}</b> integración social</span><span><b>{community.city}</b> {community.region}</span></div></div></section>
 
 <section className="pulse"><div><p className="eyebrow">RITMO DE MANTENIMIENTO</p><h2>La operación,<br/><em>resumida.</em></h2></div><div className="pulseGrid"><article><span className="pulseNumber">{monthly.toString().padStart(2,"0")}</span><small>Rutinas mensuales</small><i className="okLine"/></article><article><span className="pulseNumber">{bimonthly.toString().padStart(2,"0")}</span><small>Rutina bimensual</small><i className="warnLine"/></article><article><span className="pulseNumber">{quarterly.toString().padStart(2,"0")}</span><small>Rutina trimestral</small><i className="certLine"/></article><article><span className="pulseNumber">{demand.toString().padStart(2,"0")}</span><small>A requerimiento</small><i className="mutedLine"/></article></div></section>
 
 <BeforeAfter/>
 
 <section className="intro" id="maintenance"><p className="eyebrow">MANTENIMIENTO, SIN COMPLICACIONES</p><div className="split"><h2>Entiende tu edificio<br/>de un vistazo.</h2><p>De una planilla técnica a una experiencia visual. Cada sistema tiene su frecuencia y responsable claramente identificado. Toca una tarjeta para abrir su ficha.</p></div><div className="filters" role="group" aria-label="Filtrar mantenciones">{filters.map(x=><button key={x} onClick={()=>setFilter(x)} className={filter===x?"active":""}>{x}</button>)}</div></section>
 
 <section className="systems">{visible.map((s)=><motion.button type="button" className="system" key={s.name} onClick={()=>setSelected(community.systems.indexOf(s))} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.45}} whileHover={{y:-6}}><div className="systemVisual"><span className="visualCore"><SystemIcon name={s.name}/></span><span className="ring r1"/><span className="ring r2"/><span className="signal"/></div><div className="systemTop"><span className="index">{String(community.systems.indexOf(s)+1).padStart(2,"0")}</span><span className={"badge "+label[s.status][1]}>{label[s.status][0]}</span></div><div className="systemBody"><small>{s.frequency}</small><h3>{s.name}</h3><p>{s.note}</p></div><div className="provider"><span>Responsable</span><b>{s.provider}</b><strong>Ver ficha →</strong></div></motion.button>)}</section>
 
 <section className="calendar"><div className="eyebrow">EL AÑO COMPLETO · EN UNA MIRADA</div><div className="split"><h2>Calendario<br/><em>que sí se entiende.</em></h2><p>La vista anual resume las frecuencias del calendario oficial sin reemplazar sus celdas semanales. Las cuatro rutinas mensuales están presentes durante todo el año; las bimensuales y trimestrales se consultan en su programación específica.</p></div><div className="calendarLegend"><span><b>04</b> mensuales</span><span><b>01</b> bimensual</span><span><b>01</b> trimestral</span><span><b>03</b> por requerimiento</span></div><div className="months">{months.map((m,i)=><div className={"month "+(i===currentMonth?"active":"")} key={m}><div className="monthHead"><span>{m}</span>{i===currentMonth&&<small>MES ACTUAL</small>}</div><div className="routinePips" aria-label="Cuatro rutinas mensuales"><i/><i/><i/><i/></div><p>4 rutinas mensuales</p></div>)}</div><p className="calendarNote">Referencia visual basada en las frecuencias declaradas en el calendario de mantención de {community.name}.</p></section>
 
 <section className="providers"><p className="eyebrow">QUIÉNES CUIDAN TU COMUNIDAD</p><h2>Personas y empresas<br/>detrás de cada sistema.</h2><div className="providerGrid">{community.providers.map(p=><article className="providerCard" key={p.name}><div className="providerLogo">{p.name.slice(0,2).toUpperCase()}</div><div className="verifyRow"><small>{p.service}</small>{p.verified&&<span>VERIFICADO</span>}</div><h3>{p.name}</h3><p>{p.detail}</p>{p.web?<a href={p.web} target="_blank" rel="noreferrer">Conocer proveedor ↗</a>:<span className="pending">Información por validar</span>}</article>)}</div></section>
 
 <section className="security"><div><p className="eyebrow">SEGURIDAD & CERTIFICACIONES</p><h2>Lo importante,<br/>siempre visible.</h2><p className="securityLead">Fechas, estados y obligaciones dejan de esconderse en carpetas. La comunidad puede entender rápidamente qué documento requiere actualización, mantención o certificación.</p></div><div className="certs">{community.certifications.map((c,i)=><article key={c.name}><span>{c.icon}</span><div><small>{c.frequency}</small><h3>{c.name}</h3><p>{c.state}</p></div><b>0{i+1}</b></article>)}</div></section>
 
 <CommunityMap/>
 
 <section className="future"><div className="glow"/><p className="eyebrow">ESTO ES SOLO EL COMIENZO</p><h2>Hoy ves tu mantenimiento.<br/><em>Mañana, tu comunidad completa<br/>podría vivir aquí.</em></h2><div className="futureTags">{["Historial","Documentos","Activos","Avisos","Evidencias","Proveedores","Certificados","Comunidad"].map(x=><span key={x}>{x}<small>PRÓXIMAMENTE</small></span>)}</div><div className="signature"><div className="mark">O</div><div><b>ORBI CONDO</b><span>Smart Community Experience</span></div></div></section>
 <footer><span>Concept experience · {community.name}</span><span>Powered by ORBI Ecosystem · 2026</span></footer>
 
 <AnimatePresence>{active&&<motion.div className="drawerBackdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}><motion.aside className="assetDrawer" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:28,stiffness:240}} onClick={e=>e.stopPropagation()}><button className="drawerClose" onClick={()=>setSelected(null)} aria-label="Cerrar ficha">×</button><div className="drawerVisual"><span><SystemIcon name={active.name} size={72}/></span><i/><i/></div><p className="eyebrow">FICHA DE SISTEMA</p><h2>{active.name}</h2><span className={"badge "+label[active.status][1]}>{label[active.status][0]}</span><div className="drawerData"><div><small>Frecuencia</small><b>{active.frequency}</b></div><div><small>Responsable</small><b>{active.provider}</b></div><div><small>Función</small><b>{active.note}</b></div></div><p className="drawerNote">Esta ficha crecerá con historial, informes, evidencias, contratos y documentos del activo cuando la comunidad habilite esos módulos.</p></motion.aside></motion.div>}</AnimatePresence>
 </main>
}