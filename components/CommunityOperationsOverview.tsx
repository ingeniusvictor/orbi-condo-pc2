import styles from "./CommunityOperationsOverview.module.css";

const roles=[
  {
    count:6,
    title:"Auxiliares de aseo",
    icon:"✦",
    summary:"Mantienen limpios, ordenados y presentables los espacios comunes que usan todos los días residentes y visitas.",
    duties:["Áreas comunes","Apoyo al orden diario","Observación de condiciones básicas"],
  },
  {
    count:3,
    title:"Conserjería",
    icon:"◎",
    summary:"Da continuidad a la atención operativa del condominio, el control cotidiano de accesos y el apoyo ante situaciones del día a día.",
    duties:["Accesos y atención","Cobertura por turnos","Apoyo ante incidencias"],
  },
  {
    count:1,
    title:"Mayordomía",
    icon:"◇",
    summary:"Coordina la operación cotidiana de Parque Ciudadano II y apoya la continuidad del servicio entre equipos, turnos y requerimientos.",
    duties:["Coordinación operativa","Seguimiento de continuidad","Apoyo a coberturas"],
  },
  {
    count:1,
    title:"Asistencia administrativa",
    icon:"▤",
    summary:"Apoya la organización documental y los procesos administrativos necesarios para el funcionamiento ordenado de la comunidad.",
    duties:["Gestión documental","Seguimiento administrativo","Soporte a la operación"],
  },
] as const;

const shifts=[
  {name:"Mañana",time:"07:00 — 14:30",label:"Inicio del día",tone:"morning"},
  {name:"Tarde",time:"14:30 — 22:00",label:"Continuidad operativa",tone:"afternoon"},
  {name:"Noche",time:"22:00 — 07:00",label:"Cobertura nocturna",tone:"night"},
] as const;

export default function CommunityOperationsOverview(){
  return <section className={styles.section} id="equipo-operativo" aria-labelledby="equipo-operativo-title">
    <div className={styles.glowOne} aria-hidden="true"/>
    <div className={styles.glowTwo} aria-hidden="true"/>
    <div className={styles.inner}>
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>PARQUE CIUDADANO II · OPERACIÓN COTIDIANA</p>
          <h2 id="equipo-operativo-title">Las personas que hacen que<br/><em>la comunidad funcione.</em></h2>
        </div>
        <div className={styles.headCopy}>
          <p>Una mirada simple a la estructura del equipo directo y a cómo se organiza la cobertura diaria del condominio.</p>
          <span className={styles.publicBadge}><i/> Información institucional · sin datos personales</span>
        </div>
      </header>

      <div className={styles.teamSummary} aria-label="Resumen del equipo directo">
        <div className={styles.total}><span>Equipo directo</span><strong>11</strong><small>colaboradores</small></div>
        <div className={styles.mix}>
          <span><b>06</b> Aseo</span>
          <span><b>03</b> Conserjería</span>
          <span><b>01</b> Mayordomía</span>
          <span><b>01</b> Administración</span>
        </div>
      </div>

      <div className={styles.roleGrid}>
        {roles.map(role=><article className={styles.roleCard} key={role.title}>
          <div className={styles.roleTop}><span className={styles.roleIcon}>{role.icon}</span><span className={styles.roleCount}>{String(role.count).padStart(2,"0")}</span></div>
          <h3>{role.title}</h3>
          <p>{role.summary}</p>
          <div className={styles.duties}>{role.duties.map(duty=><span key={duty}>{duty}</span>)}</div>
        </article>)}
      </div>

      <div className={styles.shiftPanel}>
        <div className={styles.shiftIntro}>
          <p className={styles.eyebrow}>TURNOS Y COBERTURA</p>
          <h3>Un día completo,<br/><em>fácil de entender.</em></h3>
          <p>La operación de conserjería se organiza en bloques consecutivos para mantener continuidad durante el día y la noche.</p>
          <div className={styles.coveragePill}><span>24 h</span><div><b>Cobertura organizada</b><small>Distribuida en tres turnos habituales</small></div></div>
        </div>

        <div className={styles.shiftVisual} aria-label="Turnos habituales de conserjería">
          <div className={styles.timeline} aria-hidden="true"><i/><i/><i/></div>
          <div className={styles.shiftCards}>
            {shifts.map((shift,index)=><article className={`${styles.shiftCard} ${styles[shift.tone]}`} key={shift.name}>
              <div className={styles.shiftNumber}>0{index+1}</div>
              <small>{shift.label}</small>
              <h4>{shift.name}</h4>
              <strong>{shift.time}</strong>
              <span className={styles.shiftState}><i/> Turno habitual</span>
            </article>)}
          </div>
          <div className={styles.specialCoverage}>
            <div className={styles.specialIcon}>↻</div>
            <div className={styles.specialText}><small>DOMINGOS Y FERIADOS</small><strong>Cobertura especial en dos bloques</strong><p>La continuidad se organiza con un turno diurno de <b>08:00–20:00</b> y uno nocturno de <b>20:00–08:00</b>.</p></div>
            <div className={styles.specialTimes}><span><b>08:00</b> → 20:00</span><span><b>20:00</b> → 08:00</span></div>
          </div>
        </div>
      </div>

      <footer className={styles.note}>
        <span>ORBI LIVING</span>
        <p>Esta vista explica la estructura general del servicio. No publica nombres, ausencias, reemplazos, contactos, remuneraciones ni información contractual individual.</p>
      </footer>
    </div>
  </section>;
}
