import {motion} from "framer-motion";

export default function BeforeAfter(){
 return <section className="transformation">
   <div className="transformationCopy">
     <p className="eyebrow">MISMA INFORMACIÓN · OTRA EXPERIENCIA</p>
     <h2>De una planilla<br/>a una <em>comunidad visible.</em></h2>
     <p>El calendario original cumple su función técnica. ORBI Condo conserva esa información y cambia la forma en que un residente la entiende, la explora y la recuerda.</p>
   </div>
   <div className="compareStage">
     <motion.article className="legacyCard" initial={{opacity:0,x:-20,rotate:-2}} whileInView={{opacity:1,x:0,rotate:-2}} viewport={{once:true}}>
       <div className="compareLabel">ANTES · PLANILLA</div>
       <div className="legacySheet">
         <div className="legacyLogo">PC2</div>
         <div className="legacyTitle">CALENDARIO MANTENCIÓN</div>
         <div className="legacyGrid">{Array.from({length:42}).map((_,i)=><i key={i} className={i%11===0||i%13===0?"green":i>33&&i%3===0?"yellow":""}/>)}</div>
         <div className="legacyRows">{["ASCENSORES","SALA DE BOMBAS","JARDÍN","PLAGAS","PISCINA","CCTV"].map(x=><span key={x}>{x}<b/></span>)}</div>
       </div>
     </motion.article>
     <motion.article className="orbiCard" initial={{opacity:0,x:20,y:20}} whileInView={{opacity:1,x:0,y:0}} viewport={{once:true}} transition={{delay:.12}}>
       <div className="compareLabel">AHORA · ORBI CONDO</div>
       <div className="orbiMiniTop"><span>O</span><div><small>PARQUE CIUDADANO II</small><b>Mantenimiento</b></div><i/></div>
       <div className="orbiMiniHero"><small>RUTINA MENSUAL</small><strong>Ascensores</strong><p>Mensual · Atlagich Ascensores</p></div>
       <div className="orbiMiniMetrics"><span><b>04</b>Mensuales</span><span><b>01</b>Bimensual</span><span><b>01</b>Trimestral</span></div>
       <div className="orbiMiniLine"><i/><b/><b/><b/><b/><b/></div>
     </motion.article>
   </div>
 </section>
}
