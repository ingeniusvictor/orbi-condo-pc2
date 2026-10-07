"use client";
import {motion} from "framer-motion";
import {community} from "../data/community";

export default function CommunityMap(){
 return <section className="communityMap">
   <div className="communityMapCopy">
     <p className="eyebrow">UNA COMUNIDAD COMPLETA</p>
     <h2>No es solo<br/>mantención.<br/><em>Es un ecosistema.</em></h2>
     <p>{community.name} tiene espacios y servicios que también pueden ganar visibilidad digital. Esta capa los presenta como parte de una misma experiencia comunitaria.</p>
     <small>Equipamiento publicado para {community.name}.</small>
   </div>
   <motion.div className="campus" initial={{opacity:0,scale:.96}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{duration:.7}}>
     <div className="campusGrid"/>
     <div className="tower t1"><i/><i/><i/><i/></div><div className="tower t2"><i/><i/><i/><i/></div><div className="tower t3"><i/><i/><i/><i/></div>
     <div className="poolShape"><span>PISCINA</span></div><div className="greenShape"><span>JARDÍN</span></div><div className="route rA"/><div className="route rB"/>
     <div className="campusCore"><span>O</span><b>PC2</b><small>ORBI CONDO</small></div>
     <div className="amenityCloud">{community.amenities.map((x,i)=><span key={x} className={`a${i+1}`}>{x}</span>)}</div>
   </motion.div>
 </section>
}
