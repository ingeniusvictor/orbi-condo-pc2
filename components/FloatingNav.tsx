"use client";

const items=[
 {label:"Inicio",target:".hero"},
 {label:"Mantención",target:"#maintenance"},
 {label:"Calendario",target:".calendar"},
 {label:"Proveedores",target:".providers"},
 {label:"Seguridad",target:".security"}
];

export default function FloatingNav(){
 const go=(target:string)=>document.querySelector(target)?.scrollIntoView({behavior:"smooth",block:"start"});
 return <div className="floatingNav" role="navigation" aria-label="Navegación principal">
   <button className="floatingBrand" onClick={()=>go(".hero")} aria-label="Ir al inicio"><span>O</span><b>ORBI</b></button>
   <div className="floatingLinks">{items.slice(1).map(item=><button key={item.label} onClick={()=>go(item.target)}>{item.label}</button>)}</div>
   <button className="floatingPulse" onClick={()=>go(".future")} aria-label="Ver visión futura"><i/>PC2</button>
 </div>
}
