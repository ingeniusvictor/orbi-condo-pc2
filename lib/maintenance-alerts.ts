export type AlertLevel="upcoming"|"due"|"overdue";
export type MaintenanceEvent={
 id:string;communityId:string;assetId:string;assetName:string;
 dueDate:string;completedAt?:string|null;cancelledAt?:string|null;
};
export type AlertPolicy={leadDays:number[];overdueCadenceDays:number;timezone:string};
export type MaintenanceAlert={
 key:string;eventId:string;assetName:string;level:AlertLevel;daysUntilDue:number;
 dueDate:string;message:string;
};
export const DEFAULT_ALERT_POLICY:AlertPolicy={leadDays:[30,7,1],overdueCadenceDays:1,timezone:"America/Santiago"};
const DAY=86400000;
function dateKey(date:Date,timezone:string){
 return new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
}
function utcDay(key:string){
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(key))throw new Error("Invalid ISO date");
 const stamp=Date.parse(key+"T00:00:00Z");
 if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==key)throw new Error("Invalid calendar date");
 return stamp;
}
export function evaluateMaintenanceAlerts(events:MaintenanceEvent[],now:Date,policy:AlertPolicy=DEFAULT_ALERT_POLICY):MaintenanceAlert[]{
 if(!Number.isFinite(now.getTime()))throw new Error("Invalid evaluation time");
 if(!Number.isInteger(policy.overdueCadenceDays)||policy.overdueCadenceDays<1)throw new Error("Invalid cadence");
 if(policy.leadDays.some(n=>!Number.isInteger(n)||n<1))throw new Error("Invalid lead days");
 const today=dateKey(now,policy.timezone);
 const todayDay=utcDay(today);
 const leads=new Set(policy.leadDays);
 return events.flatMap(event=>{
  if(event.completedAt||event.cancelledAt)return [];
  const delta=Math.round((utcDay(event.dueDate)-todayDay)/DAY);
  let level:AlertLevel;
  if(delta>0){if(!leads.has(delta))return [];level="upcoming";}
  else if(delta===0)level="due";
  else {if((-delta)%policy.overdueCadenceDays!==0)return [];level="overdue";}
  const message=delta>0?`Mantención en ${delta} día${delta===1?"":"s"}.`:delta===0?"Mantención programada para hoy.":`Mantención vencida hace ${-delta} día${delta===-1?"":"s"}. Revisar ejecución.`;
  return [{key:`${event.communityId}:${event.id}:${today}:${level}`,eventId:event.id,assetName:event.assetName,level,daysUntilDue:delta,dueDate:event.dueDate,message}];
 });
}
export type NotificationDelivery={alertKey:string;recipientId:string;channel:"email"|"in_app";status:"queued"|"sent"|"failed"|"acknowledged";};
export function deliveryKey(alertKey:string,recipientId:string,channel:NotificationDelivery["channel"]){
 return [alertKey,recipientId,channel].join(":");
}
