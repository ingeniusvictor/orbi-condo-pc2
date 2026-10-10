"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";

const homeItems=[
 {label:"Inicio",target:".hero"},
 {label:"Mantención",target:"#maintenance"},
 {label:"Calendario",target:".calendar"},
 {label:"Proveedores",target:".providers"},
 {label:"Seguridad",target:".security"}
];
const operationItems=[
 {label:"Panel",href:"/panel-operativo"},
 {label:"Turnos",href:"/calendario-turnos"},
 {label:"Incidencias",href:"/emergencias-demo"},
 {label:"Bitácora",href:"/operaciones-demo"},
 {label:"Admin",href:"/administracion-demo"}
];

export default function FloatingNav(){
 const pathname=usePathname();
 const router=useRouter();
 const isHome=pathname==="/";
 const [active,setActive]=useState("Inicio");
 useEffect(()=>{
  if(!isHome)return;
  const sections=homeItems.map(item=>({item,el:document.querySelector(item.target)})).filter(x=>x.el) as {item:{label:string,target:string},el:Element}[];
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
   if(!visible)return;
   const match=sections.find(x=>x.el===visible.target);
   if(match)setActive(match.item.label);
  },{rootMargin:"-28% 0px -58% 0px",threshold:[0,.15,.4]});
  sections.forEach(x=>observer.observe(x.el));
  return ()=>observer.disconnect();
 },[isHome]);
 const go=(target:string)=>document.querySelector(target)?.scrollIntoView({behavior:"smooth",block:"start"});
 if(!isHome){
  return <><div className="floatingNavSpacer" aria-hidden="true"/><div className="floatingNav floatingNavOps" role="navigation" aria-label="Navegación operativa">
   <button className="floatingBrand" onClick={()=>router.push("/")} aria-label="Volver a ORBI LIVING"><span>O</span><b>ORBI</b></button>
   <div className="floatingLinks opsLinks">{operationItems.map(item=><button key={item.href} className={pathname===item.href?"active":""} aria-current={pathname===item.href?"page":undefined} onClick={()=>router.push(item.href)}>{item.label}</button>)}</div>
  </div></>;
 }
 return <div className="floatingNav" role="navigation" aria-label="Navegación principal">
   <button className={"floatingBrand "+(active==="Inicio"?"active":"")} onClick={()=>go(".hero")} aria-label="Ir al inicio"><span>O</span><b>ORBI</b></button>
   <div className="floatingLinks">{homeItems.slice(1).map(item=><button key={item.label} className={active===item.label?"active":""} aria-current={active===item.label?"page":undefined} onClick={()=>go(item.target)}>{item.label}</button>)}</div>
   <button className="floatingPulse" onClick={()=>go(".future")} aria-label="Ver visión futura"><i/>PC2</button>
 </div>;
}
