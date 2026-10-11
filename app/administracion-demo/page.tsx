import { COMMUNITY_FELIZ_VISIBLE_MODULES, PC2_INSTITUTIONAL_BASELINE } from "../../data/pc2-institutional-baseline";

const panel: React.CSSProperties = {
  background: "#10293a",
  border: "1px solid #34576a",
  borderRadius: 18,
  padding: 20,
};

const pending = [
  "Verificar inventario vigente de unidades y su distribución por subadministración.",
  "Confirmar quién autoriza suplencias y cuál es el flujo fuera de horario.",
  "Confirmar el procedimiento formal de emergencias y escalamiento 24/7.",
  "Identificar qué módulos de ComunidadFeliz están realmente habilitados y si existe exportación o API autorizada.",
  "Solicitar versión contractual consolidada o criterio escrito para notificaciones, renovaciones y término.",
  "Validar formalmente los horarios especiales de domingos y feriados antes de cargar datos reales.",
];

export default function AdministracionDemo() {
  const baseline = PC2_INSTITUTIONAL_BASELINE;
  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top right,#183f50,#07131f 65%)", color: "#eefbff", padding: "clamp(16px,4vw,52px)", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1160, margin: "auto" }}>
        <nav style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a href="/panel-operativo" style={{ color: "#7ce6e2" }}>← Panel operativo</a>
          <a href="/calendario-turnos" style={{ color: "#7ce6e2" }}>Turnos</a>
          <a href="/emergencias-demo" style={{ color: "#7ce6e2" }}>Incidencias</a>
        </nav>

        <header style={{ margin: "28px 0" }}>
          <p style={{ color: "#75e0dd", letterSpacing: 3, fontSize: 12 }}>ORBI LIVING · GESTIÓN DOCUMENTAL</p>
          <h1 style={{ fontSize: "clamp(34px,5vw,56px)", margin: "8px 0" }}>Centro administrativo<span style={{ color: "#6fe3df" }}>.</span></h1>
          <p style={{ color: "#aac4d1", maxWidth: 780, lineHeight: 1.6 }}>
            Vista de referencia construida solo con información institucional derivada de los documentos recibidos. No contiene contratos originales, firmas ni datos personales.
          </p>
        </header>

        <p role="note" style={{ ...panel, background: "#292c2d", borderColor: "#8b7652", fontSize: 14 }}>
          Esta pantalla no interpreta jurídicamente contratos ni reemplaza documentación oficial. Las fechas y montos sirven para seguimiento administrativo y deben verificarse contra el documento vigente antes de tomar decisiones.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, margin: "18px 0" }}>
          <article style={panel}><small style={{ color: "#9db9c7" }}>Unidades habitacionales</small><div style={valueStyle}>{baseline.residentialUnits.value}</div><small style={{ color: "#abc5d1" }}>Contrato 2024 · inventario actual por verificar</small></article>
          <article style={panel}><small style={{ color: "#9db9c7" }}>Subadministraciones</small><div style={valueStyle}>{baseline.subAdministrations.value}</div><small style={{ color: "#abc5d1" }}>Delimitación operativa pendiente</small></article>
          <article style={panel}><small style={{ color: "#9db9c7" }}>Urgencias administración</small><div style={valueStyle}>{baseline.emergencyAttention.value}</div><small style={{ color: "#abc5d1" }}>Referencia contractual</small></article>
          <article style={panel}><small style={{ color: "#9db9c7" }}>Honorario anexo 2026</small><div style={valueStyle}>{baseline.administrationMonthlyFeeUF.value.toLocaleString("es-CL", { minimumFractionDigits: 3 })} UF</div><small style={{ color: "#abc5d1" }}>Más IVA · no convertido a CLP</small></article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 14 }}>
          <article style={panel}>
            <h2 style={{ marginTop: 0 }}>Referencia contractual</h2>
            <div style={rowStyle}><span>Administradora</span><strong>{baseline.administrator.value}</strong></div>
            <div style={rowStyle}><span>Inicio del anexo</span><strong>{baseline.annexEffectiveFrom.value}</strong></div>
            <div style={rowStyle}><span>Fin inicial indicado</span><strong>{baseline.annexInitialEnd.value}</strong></div>
            <p style={{ color: "#9fbcc9", fontSize: 13, lineHeight: 1.6 }}>Las reglas de renovación, aviso o remoción deben leerse en conjunto con los instrumentos vigentes. ORBI no resuelve automáticamente diferencias entre cláusulas.</p>
          </article>

          <article style={panel}>
            <h2 style={{ marginTop: 0 }}>ComunidadFeliz · referencia recibida</h2>
            <div style={rowStyle}><span>Factura recibida</span><strong>${baseline.communityFelizInvoiceCLP.value.toLocaleString("es-CL")}</strong></div>
            <p style={{ color: "#9fbcc9", fontSize: 13, lineHeight: 1.6 }}>El documento acredita una factura puntual; no se presume que el valor sea mensual ni que todos los módulos visibles estén habilitados.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
              {COMMUNITY_FELIZ_VISIBLE_MODULES.map(module => <span key={module} style={{ border: "1px solid #41697a", background: "#142f40", borderRadius: 20, padding: "6px 9px", fontSize: 11, color: "#bfe3e6" }}>{module}</span>)}
            </div>
          </article>
        </section>

        <section style={{ ...panel, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Validaciones pendientes</h2>
          <p style={{ color: "#a9c4d0" }}>Estas preguntas bloquean funciones de producción, pero no impiden seguir construyendo prototipos anónimos.</p>
          <ol style={{ lineHeight: 1.7, paddingLeft: 22 }}>{pending.map(item => <li key={item} style={{ marginBottom: 8 }}>{item}</li>)}</ol>
        </section>

        <section style={{ ...panel, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Principio de convivencia</h2>
          <p style={{ color: "#b8d0da", lineHeight: 1.65, marginBottom: 0 }}>
            ORBI LIVING prioriza turnos, continuidad operativa, incidencias, relevo y seguimiento documental. Recaudación, contabilidad, remuneraciones, visitas y control de acceso no deben duplicarse hasta conocer las capacidades efectivas de la plataforma existente y la forma autorizada de interoperar.
          </p>
        </section>

        <p style={{ color: "#8cacbc", fontSize: 12, marginTop: 20 }}>Los PDFs originales y la información personal permanecen fuera del repositorio público. La futura gestión documental real deberá usar almacenamiento privado, permisos por rol y auditoría.</p>
      </div>
    </main>
  );
}

const valueStyle: React.CSSProperties = { fontSize: 31, fontWeight: 800, color: "#79e3df", margin: "7px 0" };
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 18, alignItems: "baseline", borderBottom: "1px solid #29495a", padding: "11px 0", flexWrap: "wrap" };
