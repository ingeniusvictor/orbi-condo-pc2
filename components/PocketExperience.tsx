"use client";
import {motion} from "framer-motion";
import {community} from "../data/community";

export default function PocketExperience(){
 return <section className="pocket">
   <div className="pocketCopy">
     <p className="eyebrow">PC2 EN TU BOLSILLO</p>
     <h2>La comunidad<br/>también puede sentirse<br/><em>así de simple.</em></h2>
     <p>Una experiencia pensada para abrirse desde un enlace o QR y entender lo importante sin instalar una aplicación ni aprender un sistema complejo.</p>
     <div className="pocketPoints"><span><i/>Diseñado para móvil</span><span><i/>Información directa</span><span><i/>Sin login en esta demo</span></div>
   </div>
   <div className="phoneStage">
     <div className="phoneHalo"/>
     <motion.div className="phone" initial={{opacity:0,y:35,rotate:3}} whileInView={{opacity:1,y:0,rotate:-2}} viewport={{once:true}} transition={{duration:.75,type:"spring",damping:18}}>
       <div className="phoneBezel">
         <div className="phoneIsland"/>
         <div className="phoneScreen">
           <div className="mobileTop"><span>O</span><div><small>ORBI CONDO</small><b>{community.name}</b></div><i/></div>
           <div className="mobileHero"><small>MI COMUNIDAD</small><strong>Todo lo esencial,<br/>en una mirada.</strong><p>{community.city} · {community.housingCount} viviendas</p></div>
           <div className="mobileQuick"><article><span>09</span><small>Sistemas</small></article><article><span>04</span><small>Certificaciones</small></article></div>
           <div className="mobileSectionTitle"><b>Mantención</b><span>Ver todo</span></div>
           <div className="mobileRows">{community.systems.slice(0,3).map((s,i)=><div key={s.name}><span>{String(i+1).padStart(2,"0")}</span><div><b>{s.name}</b><small>{s.frequency}</small></div><i>›</i></div>)}</div>
           <div className="mobileNav"><span className="on">●<small>Inicio</small></span><span>◌<small>Calendario</small></span><span>◇<small>Comunidad</small></span></div>
         </div>
       </div>
     </motion.div>
     <motion.div className="phoneFloat floatA" initial={{opacity:0,scale:.8}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:.35}}><small>ACCESO RÁPIDO</small><b>QR + Web</b></motion.div>
     <motion.div className="phoneFloat floatB" initial={{opacity:0,scale:.8}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:.48}}><small>EXPERIENCIA</small><b>Responsive</b></motion.div>
   </div>
 </section>
}
