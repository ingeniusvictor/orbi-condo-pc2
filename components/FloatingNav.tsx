"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";

type HomeItem={label:string;target:string;short?:string;mobileHide?:boolean};

const primaryHomeItems:HomeItem[]=[
 {label:"Operación",target:"#equipo-operativo",short:"Operación"},
 {label:"Mantención",target:"#maintenance",short:"Mantención"},
 {label:"Seguridad",target:".security",short:"Seguridad",mobileHide:true},
 {label:"Finanzas",target:"#orbi-finance",short:"Finanzas"},
 {label:"Documentos",target:"#biblioteca-tecnica",short:"Docs",mobileHide:true},
 {label:"Comunidad",target:".communityVoice",short:"Comunidad",mobileHide:true},
];

const secondaryHomeItems:HomeItem[]=[
 {label:"Patrimonio",target:"#patrimonio-condominio"},
 {label:"Calendario",target:".calendar"},
 {label:"Proveedores",target:".providers"},
 {label:"Viviendas",target:"#apartments"},
 {label:"Evidencias",target:"#orbi-evidence"},
 {label:"Pagos",target:"#orbi-pay"},
 {label:"Futuro",target:".future"},
];

const trackedHomeItems:HomeItem[]=[
 {label:"Inicio",target:".hero"},
 ...primaryHomeItems,
 ...secondaryHomeItems,
];

const operationItems=[
 {label:"Panel",href:"/panel-operativo",matches:["/panel-operativo"]},
 {label:"Turnos",href:"/calendario-turnos",matches:["/calendario-turnos","/turnos-planificador","/turnos-demo"]},
 {label:"Incidencias",href:"/emergencias-demo",matches:["/emergencias-demo"]},
 {label:"Bitácora",href:"/operaciones-demo",matches:["/operaciones-demo","/entrega-turnos-demo"]},
 {label:"Admin",href:"/administracion-demo",matches:["/administracion-demo"]}
];

export default function FloatingNav(){
 const pathname=usePathname();
 const isHome=pathname==="/";
 const [active,setActive]=useState("Inicio");
 const [moreOpen,setMoreOpen]=useState(false);
 const navRef=useRef<HTMLElement|null>(null);

 useEffect(()=>{
  if(!isHome)return;
  const sections=trackedHomeItems.map(item=>({item,el:document.querySelector(item.target)})).filter(x=>x.el) as {item:HomeItem;el:Element}[];
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
   if(!visible)return;
   const match=sections.find(x=>x.el===visible.target);
   if(match)setActive(match.item.label);
  },{rootMargin:"-24% 0px -62% 0px",threshold:[0,.12,.3]});
  sections.forEach(x=>observer.observe(x.el));
  return ()=>observer.disconnect();
 },[isHome]);

 useEffect(()=>{
  if(!moreOpen)return;
  const onPointerDown=(event:PointerEvent)=>{
   const target=event.target as Node;
   if(navRef.current&&!navRef.current.contains(target))setMoreOpen(false);
  };
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setMoreOpen(false);};
  window.addEventListener("pointerdown",onPointerDown);
  window.addEventListener("keydown",onKeyDown);
  return ()=>{window.removeEventListener("pointerdown",onPointerDown);window.removeEventListener("keydown",onKeyDown);};
 },[moreOpen]);

 const go=(target:string)=>{
  setMoreOpen(false);
  document.querySelector(target)?.scrollIntoView({behavior:"smooth",block:"start"});
 };

 if(pathname==="/operaciones"||pathname==="/operaciones/extendida"||pathname==="/conserjeria")return null;
 if(!isHome){
  return <><div className="floatingNavSpacer" aria-hidden="true"/><nav className="floatingNav floatingNavOps" aria-label="Navegación operativa">
   <Link className="floatingBrand" href="/" aria-label="Volver a ORBI LIVING"><span>O</span><b>ORBI</b></Link>
   <div className="floatingLinks opsLinks">{operationItems.map(item=>{const current=item.matches.includes(pathname);return <Link key={item.href} href={item.href} className={current?"active":""} aria-current={current?"page":undefined}>{item.label}</Link>;})}</div>
  </nav></>;
 }

 const secondaryActive=secondaryHomeItems.some(item=>item.label===active);
 return <nav ref={navRef} className="floatingNav floatingNavHome" aria-label="Secciones del Portal de la Comunidad">
   {moreOpen&&<div id="portal-more-menu" className="floatingMore" role="menu" aria-label="Más secciones">
     <div className="floatingMoreHead"><div><small>PORTAL PC2</small><strong>Más secciones</strong></div><button type="button" onClick={()=>setMoreOpen(false)} aria-label="Cerrar menú">×</button></div>
     <div className="floatingMoreGrid">
       {[...primaryHomeItems.filter(item=>item.mobileHide),...secondaryHomeItems].map(item=><button type="button" role="menuitem" key={item.label} className={active===item.label?"active":""} onClick={()=>go(item.target)}><span>{item.label}</span><i>↗</i></button>)}
     </div>
   </div>}
   <button className={"floatingBrand "+(active==="Inicio"?"active":"")} onClick={()=>go(".hero")} aria-label="Ir al inicio"><span>O</span><b>ORBI</b></button>
   <div className="floatingLinks homeLinks">{primaryHomeItems.map(item=><button type="button" key={item.label} className={`${active===item.label?"active":""} ${item.mobileHide?"navMobileHide":""}`} aria-current={active===item.label?"page":undefined} onClick={()=>go(item.target)}>{item.short||item.label}</button>)}</div>
   <button type="button" className={`floatingMoreButton ${(moreOpen||secondaryActive)?"active":""}`} aria-expanded={moreOpen} aria-controls="portal-more-menu" onClick={()=>setMoreOpen(open=>!open)}><span>Más</span><i>＋</i></button>
 </nav>;
}
