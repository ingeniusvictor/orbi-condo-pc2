"use client";

import { useMemo, useState } from "react";
import type { LogCategory, FollowUpState } from "../../data/operations-log";

type DemoEntry = { id: number; category: LogCategory; summary: string; state: FollowUpState; shift: string };
const seed: DemoEntry[] = [
  { id: 1, category: "maintenance", summary: "Ejemplo ficticio: revisar luminaria en pasillo común.", state: "open", shift: "Mañana" },
  { id: 2, category: "parking", summary: "Ejemplo ficticio: informar obstrucción temporal de acceso.", state: "assigned", shift: "Tarde" },
];
const categories: { value: LogCategory; label: string }[] = [
  { value: "access", label: "Acceso" }, { value: "parcel", label: "Encomienda" },
  { value: "maintenance", label: "Mantención" }, { value: "parking", label: "Estacionamiento" },
  { value: "incident", label: "Incidente" }, { value: "handoff", label: "Entrega de turno" },
  { value: "other", label: "Otro" },
];
const labels: Record<FollowUpState, string> = { open: "Pendiente", assigned: "En seguimiento", resolved: "Resuelto" };

export default function OperationsDemo() {
  const [entries, setEntries] = useState<DemoEntry[]>(seed);
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<LogCategory>("incident");
  const [shift, setShift] = useState("Mañana");
  const pending = useMemo(() => entries.filter(item => item.state !== "resolved"), [entries]);
  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = summary.trim();
    if (!clean || clean.length > 240) return;
    setEntries(items => [{ id: Math.max(0, ...items.map(item => item.id)) + 1, category, summary: clean, state: "open", shift }, ...items]);
    setSummary("");
  }
  return <main style={{ minHeight: "100vh", background: "#09121e", color: "#f0f7ff", padding: "clamp(20px,5vw,64px)", fontFamily: "system-ui,sans-serif" }}>
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <nav style={{display:"flex",gap:14,flexWrap:"wrap"}}>
        <a href="/" style={{ color: "#8ce8e5" }}>← ORBI LIVING</a>
        <a href="/panel-operativo" style={{ color: "#8ce8e5" }}>Panel operativo</a>
        <a href="/calendario-turnos" style={{ color: "#8ce8e5" }}>Turnos</a>
        <a href="/emergencias-demo" style={{ color: "#8ce8e5" }}>Incidencias</a>
        <a href="/entrega-turnos-demo" style={{ color: "#8ce8e5" }}>Entrega de turno</a>
      </nav>
      <p style={{ color: "#8ce8e5", letterSpacing: 3, marginTop: 40 }}>ORBI OPERACIONES · PC2</p>
      <h1 style={{ fontSize: "clamp(30px,5vw,52px)", marginBottom: 10 }}>Libro de novedades</h1>
      <p>Prototipo interactivo con datos ficticios. No requiere inicio de sesión, no registra información en servidor y se reinicia al recargar.</p>
      <p role="alert" style={{ padding: 16, border: "1px solid #bfa86b", borderRadius: 12, marginTop: 20 }}>
        DEMOSTRACIÓN PÚBLICA: no ingreses nombres, teléfonos, patentes, departamentos identificables ni detalles de incidentes reales.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginTop: 32 }}>
        <section style={{ background: "#13253a", padding: 24, borderRadius: 18 }}>
          <h2>Nueva novedad ficticia</h2>
          <form onSubmit={addEntry} style={{ display: "grid", gap: 14 }}>
            <label>Turno<select value={shift} onChange={e => setShift(e.target.value)} style={fieldStyle}>{["Mañana", "Tarde", "Noche", "Part-time diurno", "Part-time nocturno"].map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Categoría<select value={category} onChange={e => setCategory(e.target.value as LogCategory)} style={fieldStyle}>{categories.map(v => <option value={v.value} key={v.value}>{v.label}</option>)}</select></label>
            <label>Descripción ficticia<textarea maxLength={240} required value={summary} onChange={e => setSummary(e.target.value)} rows={4} placeholder="Ej.: simulación de luminaria defectuosa..." style={fieldStyle} /></label>
            <button type="submit" style={buttonStyle}>Añadir a la simulación</button>
          </form>
        </section>
        <section style={{ background: "#13253a", padding: 24, borderRadius: 18 }}>
          <h2>Entrega de turno</h2>
          <p><strong>{pending.length}</strong> novedades requieren seguimiento.</p>
          <p>En la versión operativa, el siguiente turno deberá confirmar la recepción de los pendientes.</p>
          <ul>{pending.map(item => <li key={item.id} style={{ marginBottom: 12 }}>{item.summary}</li>)}</ul>
          <a href="/entrega-turnos-demo" style={{color:"#8ce8e5",fontWeight:700}}>Abrir flujo de entrega →</a>
        </section>
      </div>
      <section style={{ marginTop: 28 }}>
        <h2>Registro de demostración</h2>
        {entries.map(item => <article key={item.id} style={{ background: "#13253a", padding: 20, borderRadius: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong>{categories.find(c => c.value === item.category)?.label} · {item.shift}</strong><span>{labels[item.state]}</span>
          </div>
          <p>{item.summary}</p>
          <button style={buttonStyle} onClick={() => setEntries(all => all.map(x => x.id === item.id ? { ...x, state: x.state === "open" ? "assigned" : x.state === "assigned" ? "resolved" : "open" } : x))}>Cambiar estado (simulación)</button>
        </article>)}
      </section>
    </div>
  </main>;
}
const fieldStyle: React.CSSProperties = { display: "block", width: "100%", padding: 12, marginTop: 6, borderRadius: 8, border: "1px solid #63829b", background: "#09121e", color: "white", boxSizing: "border-box" };
const buttonStyle: React.CSSProperties = { background: "#55dad4", color: "#09202a", padding: "10px 16px", border: 0, borderRadius: 9, fontWeight: 700, cursor: "pointer" };
