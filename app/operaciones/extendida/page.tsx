import Link from "next/link";
import ExtendedOperationsWorkspace from "../extended-workspace";

export default function ExtendedOperationsPage(){
 return <>
  <div style={{position:"fixed",top:12,right:12,zIndex:80,display:"flex",alignItems:"center",gap:4,padding:4,border:"1px solid #2c6175",borderRadius:12,background:"rgba(5,24,36,.94)",boxShadow:"0 12px 34px rgba(0,0,0,.35)",backdropFilter:"blur(14px)"}} aria-label="Modo de vista">
   <Link href="/operaciones" style={{minHeight:36,display:"flex",alignItems:"center",padding:"7px 11px",borderRadius:9,color:"#a9cbd5",textDecoration:"none",fontSize:12,fontWeight:800}}>▦ Compacta</Link>
   <span style={{minHeight:36,display:"flex",alignItems:"center",padding:"7px 11px",borderRadius:9,background:"linear-gradient(135deg,#18bed0,#39e7e2)",color:"#03202a",fontSize:12,fontWeight:850}}>☷ Extendida</span>
  </div>
  <ExtendedOperationsWorkspace/>
 </>;
}
