"use client";
import { useState } from "react";
import {
  acknowledgeDemoHandoff, prepareDemoHandoff, submitDemoHandoff,
  type DemoHandoff, type DemoPendingItem, type DemoShift,
} from "../../data/shift-handoff-demo";

const seed: DemoPendingItem[] = [
  { id: "EX-001", description: "SIMULACIÓN: verificar luz de pasillo común", priority: "normal", resolved: false },
  { id: "EX-002", description: "SIMULACIÓN: informar revisión de portón", priority: "important", resolved: false },
  { id: "EX-003", description: "SIMULACIÓN: revisión finalizada de señalética", priority: "normal", resolved: true },
];
const shiftNames: Record<DemoShift, string> = { morning: "Mañana", afternoon: "Tarde", night: "Noche" };
const statusNames = { draft: "Borrador", submitted: "Enviada", acknowledged: "Recibida" };

export default function ShiftHandoffDemo() {
  const [shift, setShift] = useState<DemoShift>("morning");
  const [items, setItems] = useState(seed);
  const [handoff, setHandoff] = useState<DemoHandoff | null>(null);
  const [notice, setNotice] = useState("");
  function create() {
    setHandoff(prepareDemoHandoff("SIM-001", shift, items));
    setNotice("Entrega preparada. Revisa el resumen antes de enviarlo.");
  }
  function transition(action: "submit" | "acknowledge") {
    if (!handoff) return;
    try {
      const next = action === "submit"
        ? submitDemoHandoff(handoff, new Date().toISOString())
        : acknowledgeDemoHandoff(handoff, new Date().toISOString());
      setHandoff(next);
      setNotice(action === "submit" ? "Envío simulado correctamente." : "Recepción simulada correctamente.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Operación no disponible."); }
  }
  return <main style={{ minHeight: "100vh", background: "#081522", color: "#eefaff", padding: "clamp(20px,5vw,60px)", fontFamily: "system-ui,sans-serif" }}>
    <div style={{ maxWidth: 860, margin: "auto" }}>
      <a href="/operaciones-demo" style={{ color: "#80e5df" }}>← Libro de novedades</a>
      <p style={{ marginTop: 35, letterSpacing: 2, color: "#80e5df" }}>ORBI LIVING · DEMOSTRACIÓN</p>
      <h1>Entrega y recepción de turnos</h1>
      <p>Simulación local sin autenticación ni persistencia. No ingreses datos reales.</p>
      <div style={{ border: "1px solid #7d9aab", borderRadius: 14, padding: 22, background: "#12293b" }}>
        <label htmlFor="shift">Turno saliente</label>
        <select id="shift" value={shift} disabled={!!handoff} onChange={e => setShift(e.target.value as DemoShift)} style={field}>
          {(["morning", "afternoon", "night"] as const).map(value => <option key={value} value={value}>{shiftNames[value]}</option>)}
        </select>
        <h2>Pendientes de ejemplo</h2>
        {items.map(item => <label key={item.id} style={{ display: "block", marginBottom: 14 }}>
          <input type="checkbox" disabled={!!handoff} checked={item.resolved} onChange={e => setItems(current => current.map(x => x.id === item.id ? { ...x, resolved: e.target.checked } : x))} />
          {" "}{item.description} · {item.priority === "important" ? "Importante" : "Normal"}
        </label>)}
        {!handoff && <button style={button} onClick={create}>Preparar entrega</button>}
      </div>
      {handoff && <section style={{ marginTop: 24, borderRadius: 14, padding: 22, background: "#12293b" }}>
        <h2>Resumen de entrega</h2>
        <p>De <strong>{shiftNames[handoff.outgoing]}</strong> a <strong>{shiftNames[handoff.incoming]}</strong></p>
        <p>Estado: <strong>{statusNames[handoff.status]}</strong></p>
        <p>Pendientes transmitidos: <strong>{handoff.pending.length}</strong></p>
        <ul>{handoff.pending.map(item => <li key={item.id}>{item.description}</li>)}</ul>
        {handoff.status === "draft" && <button style={button} onClick={() => transition("submit")}>Enviar entrega (simulación)</button>}
        {handoff.status === "submitted" && <button style={button} onClick={() => transition("acknowledge")}>Confirmar recepción (simulación)</button>}
        {handoff.status === "acknowledged" && <p>Entrega completada en esta simulación.</p>}
      </section>}
      <p role="status" aria-live="polite">{notice}</p>
      <button style={{ ...button, background: "#23465c", color: "white", marginTop: 10 }} onClick={() => { setItems(seed); setHandoff(null); setShift("morning"); setNotice("Simulación reiniciada."); }}>Reiniciar simulación</button>
    </div>
  </main>;
}
const field: React.CSSProperties = { display: "block", width: "100%", margin: "10px 0 22px", padding: 12, borderRadius: 8, background: "#081522", color: "white", border: "1px solid #789" };
const button: React.CSSProperties = { border: 0, background: "#5adbd5", color: "#08202a", fontWeight: 700, borderRadius: 9, padding: "12px 16px", cursor: "pointer" };
