import {community} from "../data/community";
import styles from "./CommunityInstitutionalProfile.module.css";

function formatDate(value:string){
 const date=new Date(`${value}T12:00:00Z`);
 return new Intl.DateTimeFormat("es-CL",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(date).replace(" de "," ").replace(" de "," ");
}

function formatArea(value:number){
 return new Intl.NumberFormat("es-CL",{minimumFractionDigits:value%1?2:0,maximumFractionDigits:2}).format(value);
}

export default function CommunityInstitutionalProfile(){
 const totalTypologyUnits=community.receptionTypologies.reduce((sum,item)=>sum+item.units,0);
 return <section className={styles.section} id="patrimonio-condominio" aria-labelledby="patrimonio-condominio-title">
   <div className={styles.glow} aria-hidden="true"/>
   <div className={styles.inner}>
    <header className={styles.head}>
      <div>
        <p className={styles.eyebrow}>PARQUE CIUDADANO II · FICHA INSTITUCIONAL</p>
        <h2 id="patrimonio-condominio-title">Una comunidad real,<br/><em>mejor documentada.</em></h2>
      </div>
      <p className={styles.lead}>La información estructural del condominio se presenta separada de la operación diaria, con su fuente y criterio claramente identificados.</p>
    </header>

    <div className={styles.recordGrid}>
      <article className={styles.recordCard}>
        <span className={styles.recordIcon}>✓</span>
        <div><small>RECEPCIÓN</small><strong>Certificado N.º {community.receptionRecord.certificateNumber}</strong><p>{formatDate(community.receptionRecord.certificateDate)}</p></div>
      </article>
      <article className={styles.recordCard}>
        <span className={styles.recordIcon}>◇</span>
        <div><small>APROBACIÓN INFORMADA</small><strong>{formatDate(community.receptionRecord.approvalDate)}</strong><p>Antecedente documental incorporado a la ficha PC2.</p></div>
      </article>
    </div>

    <div className={styles.inventoryHead}>
      <div><small>PATRIMONIO COMUNITARIO</small><h3>El condominio, en números.</h3></div>
      <span className={styles.sourcePill}><i/> Datos institucionales · sin información personal</span>
    </div>

    <div className={styles.inventoryGrid} aria-label="Inventario general de unidades">
      <article><span>01</span><strong>{community.propertyInventory.apartments}</strong><p>Departamentos</p><small>Viviendas recibidas</small></article>
      <article><span>02</span><strong>{community.propertyInventory.parkingSpaces}</strong><p>Estacionamientos</p><small>Inventario comunitario</small></article>
      <article><span>03</span><strong>{community.propertyInventory.storageUnits}</strong><p>Bodegas</p><small>Inventario comunitario</small></article>
      <article><span>04</span><strong>{community.propertyInventory.commercialUnits}</strong><p>Local comercial</p><small>Unidad no residencial</small></article>
    </div>

    <div className={styles.typologyPanel}>
      <div className={styles.typologyIntro}>
        <p className={styles.eyebrow}>DISTRIBUCIÓN SEGÚN ANTECEDENTE DE RECEPCIÓN</p>
        <h3>{totalTypologyUnits} departamentos,<br/><em>siete tipologías registradas.</em></h3>
        <p>Estas superficies se mantienen como una fuente documental independiente. No sustituyen las superficies arquitectónicas ni comerciales ya publicadas en otras secciones del portal.</p>
      </div>
      <div className={styles.typologyList}>
        {community.receptionTypologies.map(item=><article key={item.code}>
          <div><strong>{item.code}</strong><span>{String(item.units).padStart(2,"0")} unidades</span></div>
          <b>{formatArea(item.areaM2)} m²</b>
        </article>)}
      </div>
    </div>

    <footer className={styles.note}>
      <span>TRAZABILIDAD</span>
      <p>Fuente: {community.receptionRecord.sourceLabel}. Las diferencias de superficie entre recepción, planos arquitectónicos y material comercial se presentan por separado para no mezclar criterios documentales.</p>
    </footer>
   </div>
  </section>;
}
