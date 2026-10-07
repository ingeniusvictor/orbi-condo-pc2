"use client";
import {useEffect,useState} from "react";

const items=[
 {label:"Inicio",target:".hero"},
 {label:"Mantención",target:"#maintenance"},
 {label:"Calendario",target:".calendar"},
 {label:"Proveedores",target:".providers"},
 {label:"Seguridad",target:".security"}
];

export default function FloatingNav(){
 const [active,setActive]=useState("Inicio");
 useEffect(()=>{
  const sections=items.map(item=>({item,el:document.querySelector(item.target)})).filter(x=>x.el) as {item:{label:string,target:string},el:Element}[];
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
   if(!visible)return;
   const match=sections.find(x=>x.el===visible.target);
   if(match)setActive(match.item.label);
  },{rootMargin:"-28% 0px -58% 0px",threshold:[0,.15,.4]});
  sections.forEach(x=>observer.observe(x.el));
  return ()=>observer.disconnect();
 },[]);
 const go=(target:string)=>document.querySelector(target)?.scrollIntoView({behavior:"smooth",block:"start"});
 return <div className="floatingNav" role="navigation" aria-label="Navegación principal">
   <button className={"floatingBrand "+(active==="Inicio"?"active":"")} onClick={()=>go(".hero")} aria-label="Ir al inicio"><span>O</span><b>ORBI</b></button>
   <div className="floatingLinks">{items.slice(1).map(item=><button key={item.label} className={active===item.label?"active":""} aria-current={active===item.label?"page":undefined} onClick={()=>go(item.target)}>{item.label}</button>)}</div>
   <button className="floatingPulse" onClick={()=>go(".future")} aria-label="Ver visión futura"><i/>PC2</button>
 </div>
}
