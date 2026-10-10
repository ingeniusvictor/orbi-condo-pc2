/** Referencias institucionales documentadas, no contiene información personal. */
export type EvidenceLevel="contract_2024"|"annex_2026"|"invoice_2026"|"ui_screenshot_2026"|"reported_pending_validation";
export type ValidationState="documented"|"requires_current_verification"|"reported_unverified";
export interface InstitutionalFact<T>{value:T;source:EvidenceLevel;validation:ValidationState;note?:string}
export const PC2_INSTITUTIONAL_BASELINE={
 propertyName:{value:"Condominio Parque Ciudadano II",source:"contract_2024",validation:"documented"},
 residentialUnits:{value:278,source:"contract_2024",validation:"requires_current_verification",note:"Contrato de marzo 2024, cláusula primera; inventario actual pendiente."},
 subAdministrations:{value:2,source:"contract_2024",validation:"documented",note:"No se dispone de asignación de unidades por subadministración."},
 administrator:{value:"Becza Gestión Limitada",source:"contract_2024",validation:"documented"},
 emergencyAttention:{value:"24/7",source:"contract_2024",validation:"documented",note:"Obligación de atención de urgencias de administración, no prueba de cobertura individual de conserjería."},
 administrationMonthlyFeeUF:{value:23.193,source:"annex_2026",validation:"documented",note:"Más IVA; no calcular monto CLP sin UF aplicable."},
 annexEffectiveFrom:{value:"2026-07-13",source:"annex_2026",validation:"documented"},
 annexInitialEnd:{value:"2027-07-13",source:"annex_2026",validation:"documented",note:"Sujeto a renovación y términos del contrato/anexo."},
 communityFelizInvoiceCLP:{value:745040,source:"invoice_2026",validation:"documented",note:"Factura puntual; periodicidad del servicio no acreditada."}
} as const satisfies Record<string,InstitutionalFact<string|number>>;
export const COMMUNITY_FELIZ_VISIBLE_MODULES=[
 "Recaudación","Egresos","Gasto común","Cobranza y recaudación","Contabilidad y finanzas",
 "Encomiendas","Libro de visitas","Bitácora","Control de acceso","Citofonía digital","Remuneraciones","Seguros"
] as const;
/** La visibilidad de un menú no garantiza suscripción, acceso o interoperabilidad. */
