/** Design contract for private, editable expense liquidations.
 * No persistence, authentication, tenant isolation or payment processing is implemented.
 * All amounts are integer Chilean pesos, never floating-point money.
 */
export type BillingRole="administrator"|"committee"|"resident";
export type ChargeLine={id:string;label:string;amountClp:number;kind:"ordinary"|"reserve"|"extra"|"adjustment"};
export type Allocation={unitId:string;shareBasisPoints:number;lines:ChargeLine[]};
export type Liquidation={
 id:string;period:string;dueDate:string|null;sourceId:string;
 unitId:string;allocations:Allocation[];status:"draft"|"reviewed"|"issued"|"void";
 revision:number;
};
export type BillingAuditEvent={entityId:string;revision:number;actorId:string;action:"create"|"edit"|"review"|"issue"|"void";at:string;reason:string};
export type BillingChange={before:Liquidation|null;after:Liquidation;audit:BillingAuditEvent};
export function validateLiquidation(x:Liquidation):string[]{
 const errors:string[]=[];
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(x.period))errors.push("Período inválido");
 if(x.dueDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(x.dueDate)||Number.isNaN(Date.parse(x.dueDate))))errors.push("Vencimiento inválido");
 if(!x.id||!x.unitId||!x.sourceId)errors.push("Faltan identificadores");
 if(!Number.isSafeInteger(x.revision)||x.revision<1)errors.push("Revisión inválida");
 if(!x.allocations.length)errors.push("Sin asignaciones");
 const ids=new Set<string>();
 for(const a of x.allocations){
  if(ids.has(a.unitId))errors.push("Unidad duplicada");ids.add(a.unitId);
  if(!a.unitId||!Number.isInteger(a.shareBasisPoints)||a.shareBasisPoints<0||a.shareBasisPoints>10000)errors.push("Prorrateo inválido");
  for(const line of a.lines)if(!line.id||!line.label||!Number.isSafeInteger(line.amountClp))errors.push("Cargo inválido");
 }
 return errors;
}
export const liquidationTotal=(x:Liquidation)=>x.allocations.reduce((sum,a)=>sum+a.lines.reduce((s,l)=>s+l.amountClp,0),0);
/** Server-side authorization must additionally verify tenant and unit ownership. */
export const mayEditBilling=(role:BillingRole)=>role==="administrator";
export const mayReviewBilling=(role:BillingRole)=>role==="committee"||role==="administrator";
export const mayReadOwnBilling=(role:BillingRole,ownsUnit:boolean)=>role!=="resident"||ownsUnit;
