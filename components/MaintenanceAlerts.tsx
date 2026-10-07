"use client";
import {useMemo,useState} from "react";
import {DEMO_EVENTS,DEMO_REFERENCE_TIME} from "../data/maintenance-alerts-demo";
import {DEFAULT_ALERT_POLICY,evaluateMaintenanceAlerts} from "../data/maintenance-alerts";
const labels={upcoming:"PRÓXIMA",due:"VENCE HOY",overdue:"VENCIDA"};
export default function MaintenanceAlerts(){
 const [days,setDays]=useState<number[]>([30,7,1]);
 const [cadence,setCadence]=useState(1);
 const alerts=useMemo(()=>evaluateMaintenanceAlerts(DEMO_EVENTS,DEMO_REFERENCE_TIME,{...DEFAULT_ALERT_POLICY,leadDays:days,overdueCadenceDays:cadence}),[days,cadence]);
 return <section className="alertCenter" id="alerts" aria-labelledby="alerts-title">
  <div className="alertIntro"><div><p className="eyebrow">ORBI MAINTENANCE ALERTS · PROTOTIPO</p><h2 id="alerts-title">El mantenimiento<br/><em>también debe avisar.</em></h2></div><p>Simulador de recordatorios y vencimientos. Las fechas son ficticias y ninguna notificación se envía a personas reales.</p></div>
  <div className="alertWorkspace">
   <div className="alertFeed"><div className="alertFeedHead"><span>VISTA DE NOTIFICACIONES</span><b>DEMO · 20 ABR 2030</b></div><div className="alertItems" aria-live="polite">{alerts.length?alerts.map(a=><article key={a.key} className={"alertItem "+a.level}><div className="alertDot"/><div><small>{labels[a.level]}</small><h3>{a.assetName}</h3><p>{a.message}</p><span>Fecha de referencia: {a.dueDate}</span></div></article>):<p className="alertEmpty">No hay avisos para esta configuración de ejemplo.</p>}</div><div className="alertFooter">Solo vista previa · Sin correo, push ni WhatsApp activo</div></div>
   <aside className="alertSettings"><p className="eyebrow">REGLAS CONFIGURABLES</p><h3>Anticiparse es parte de mantener.</h3><p>Define con cuánta anticipación se generaría un aviso.</p><fieldset><legend>Recordatorios previos</legend>{[30,7,1].map(day=><label key={day}><input type="checkbox" checked={days.includes(day)} onChange={e=>setDays(old=>e.target.checked?[...old,day]:old.filter(d=>d!==day))}/><span>{day} {day===1?"día":"días"} antes</span></label>)}</fieldset><label className="alertCadence">Repetición de alertas vencidas<select value={cadence} onChange={e=>setCadence(Number(e.target.value))}><option value={1}>Cada día</option><option value={7}>Cada 7 días</option></select></label><div className="alertChannel"><span>01</span><div><b>Correo electrónico</b><small>Requiere destinatarios autorizados y proveedor de envío</small></div><em>PRÓXIMAMENTE</em></div><div className="alertChannel"><span>02</span><div><b>Campana interna</b><small>Requiere autenticación y almacenamiento</small></div><em>PRÓXIMAMENTE</em></div></aside>
  </div><p className="alertDisclaimer">Un atraso real exige una fecha programada verificable y un cierre de ejecución. Los sistemas “por requerimiento” no generan vencimientos automáticamente. Las reglas demostradas no activan envíos.</p>
 </section>;
}
