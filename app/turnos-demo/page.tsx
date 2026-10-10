"use client";
import { useMemo, useState } from "react";

type Shift = { id: string; title: string; hours: string; start: number; end: number; color: string; icon: string };
const shifts: Shift[] = [
  { id: "morning", title: "Mañana", hours: "Horario por confirmar", start: 0, end: 8, color: "#55e3e1", icon: "☀" },
  { id: "afternoon", title: "Tarde", hours: "Horario por confirmar", start: 8, end: 16, color: "#b9a1ff", icon: "◐" },
  { id: "night", title: "Noche", hours: "Horario por confirmar", start: 16, end: 24, color: "#f9c97e", icon: "☾" },
];
const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const cards = [
  { role: "Conserjería", detail: "3 puestos fijos + 2 apoyos part-time (informado, sin validar)", count: "5" },
  { role: "Aseo", detail: "4 puestos por torre + 1 apoyo domingos/feriados (sin validar)", count: "5" },
  { role: "Mayordomía", detail: "1 puesto informado; jornada pendiente de confirmar", count: "1" },
];
export default function TurnosDemo() {
  const [day, setDay] = useState(0);
  const [area, setArea] = useState("Conserjería");
  const [selected, setSelected] = useState("morning");
  const [assigned, setAssigned] = useState<Record<string,string>>({});
  const current = useMemo(() => shifts.find(s => s.id === selected)!, [selected]);
  const key = `${day}-${area}-${selected}`;
  return <main style={{ minHeight: "100vh", background: "radial-gradient(circle at 90% 0%,#153a50 0%,#07111e 50%,#080f1a 100%)", color: "#f2f8ff", padding: "clamp(18px,4vw,56px)", fontFamily: "system-ui, sans-serif" }}>
    <div style={{ maxWidth: 1120, margin: "auto" }}>
      <a href="/operaciones-demo" style={{ color: "#7ae7e4", textDecoration: "none" }}>← ORBI Operaciones</a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 18, flexWrap: "wrap", marginTop: 36 }}>
        <div><div style={{ color: "#6ae7e1", letterSpacing: 3, fontSize: 12 }}>ORBI LIVING / PERSONAL</div><h1 style={{ fontSize: "clamp(32px,5vw,56px)", margin: "12px 0 6px" }}>Centro de turnos<span style={{ color: "#6ae7e1" }}>.</span></h1><p style={{ color: "#b6cbd8", maxWidth: 650 }}>Visualización semanal de cobertura y responsables. Diseño preliminar para Parque Ciudadano II.</p></div>
        <span style={{ padding: "10px 14px", borderRadius: 30, background: "#173744", color: "#83ece6", fontWeight: 700, fontSize: 12 }}>● DEMO · SIN DATOS REALES</span>
      </div>
      <div role="note" style={{ border: "1px solid #486d81", borderRadius: 14, padding: 16, margin: "20px 0", background: "#10283a", color: "#d7e7f2" }}>Las personas, jornadas exactas, descansos y asignaciones todavía no están verificadas. Los bloques horarios de la gráfica son únicamente ilustrativos; no representan el calendario laboral real. No ingreses nombres reales en esta demo pública.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
        {cards.map(c => <article key={c.role} style={{ border: "1px solid #28465a", background: "linear-gradient(135deg,#162e42,#0c1b2a)", padding: 20, borderRadius: 18 }}><div style={{ fontSize: 12, color: "#8eaabf" }}>DOTACIÓN PROVISIONAL</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}><strong style={{ fontSize: 21 }}>{c.role}</strong><b style={{ fontSize: 32, color: "#6ae7e1" }}>{c.count}</b></div><p style={{ fontSize: 13, color: "#b6cbd8", marginBottom: 0 }}>{c.detail}</p></article>)}
      </div>
      <section style={{ marginTop: 24, borderRadius: 20, border: "1px solid #28465a", background: "#0e2131", padding: "clamp(16px,3vw,26px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, alignItems: "center" }}><div><h2 style={{ margin: 0 }}>Planificador semanal</h2><p style={{ color: "#91a9b9", fontSize: 13 }}>Semana ilustrativa · sin fechas ni turnos reales</p></div><label>Área <select value={area} onChange={e=>setArea(e.target.value)} style={fieldStyle}>{cards.map(c=><option key={c.role}>{c.role}</option>)}</select></label></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 6, margin: "20px 0" }}>{days.map((d,i)=><button key={d} onClick={()=>setDay(i)} aria-pressed={day===i} style={{ border: day===i?"1px solid #6ae7e1":"1px solid #355166", borderRadius: 12, background: day===i?"#1c5260":"#142a3b", color: "#f2f8ff", padding: "14px 3px", cursor: "pointer", fontWeight: 700 }}>{d}</button>)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>{shifts.map(s=><button key={s.id} onClick={()=>setSelected(s.id)} aria-pressed={selected===s.id} style={{ textAlign: "left", border: selected===s.id?`2px solid ${s.color}`:"1px solid #355166", borderRadius: 16, background: "#142c40", padding: 18, color: "#f4faff", cursor: "pointer" }}><div style={{ color: s.color, fontSize: 25 }}>{s.icon}</div><h3 style={{ margin: "8px 0" }}>{s.title}</h3><small style={{ color: "#afc5d5" }}>{s.hours}</small><p style={{ color: "#e5f4fa", marginBottom: 0 }}>Responsable: <strong>{assigned[`${day}-${area}-${s.id}`] ?? "Sin confirmar"}</strong></p></button>)}</div>
        <div style={{ marginTop: 20, borderRadius: 14, background: "#172f42", padding: 20, border: "1px solid #355166" }}><h3 style={{ marginTop: 0 }}>Detalle · {days[day]} / {area} / {current.title}</h3><p style={{ color: "#b4c8d5" }}>Para explorar el diseño, selecciona un identificador ficticio de puesto. No se guardará ni compartirá.</p><label>Asignación de ejemplo <select value={assigned[key]??""} onChange={e=>setAssigned(prev=>({...prev,[key]:e.target.value}))} style={fieldStyle}><option value="">Sin confirmar</option><option value="Puesto A (ficticio)">Puesto A (ficticio)</option><option value="Puesto B (ficticio)">Puesto B (ficticio)</option><option value="Puesto C (ficticio)">Puesto C (ficticio)</option><option value="Apoyo (ficticio)">Apoyo (ficticio)</option></select></label></div>
      </section>
      <p style={{ color: "#91a9b9", fontSize: 13, marginTop: 20 }}>Los cambios son temporales y se pierden al recargar. Una versión real necesitará autenticación, permisos, historial de modificaciones y validación de turnos y descansos.</p>
    </div>
  </main>;
}
const fieldStyle: React.CSSProperties = { display: "block", marginTop: 7, borderRadius: 9, background: "#0a1928", color: "white", padding: "10px 12px", border: "1px solid #557388", maxWidth: "100%" };
