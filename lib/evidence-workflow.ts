import {canTransitionEvidence,type EvidenceStatus} from "./evidence";
export type EvidenceActorRole="administrator"|"committee"|"resident";
export type WorkOrder={id:string;systemName:string;contractorName:string;scope:string;createdBy:string;createdAt:string;};
export type ContractorInvite={id:string;workOrderId:string;expiresAt:string;revokedAt?:string;usedAt?:string;};
export type EvidenceEvent={id:string;workOrderId:string;at:string;actorId:string;type:"submitted"|"needs_changes"|"reviewed"|"accepted"|"published";note:string;};
export type EvidenceRecord={id:string;workOrderId:string;status:EvidenceStatus;publishedAt?:string;events:EvidenceEvent[]};
export function inviteIsValid(invite:ContractorInvite,orderId:string,now:string):boolean{
 return invite.workOrderId===orderId&&!invite.revokedAt&&!invite.usedAt&&Date.parse(invite.expiresAt)>Date.parse(now);
}
export function reviewEvidence(record:EvidenceRecord,actor:{id:string;role:EvidenceActorRole},to:EvidenceStatus,note:string,at:string):EvidenceRecord{
 if(!canTransitionEvidence(record.status,to,actor.role))throw new Error("Transición no autorizada.");
 if(!note.trim())throw new Error("La revisión debe registrar una observación.");
 return {...record,status:to,events:[...record.events,{id:record.id+":"+record.events.length,workOrderId:record.workOrderId,at,actorId:actor.id,type:to,note:note.trim()}]};
}
export function publishEvidence(record:EvidenceRecord,actor:{id:string;role:EvidenceActorRole},at:string):EvidenceRecord{
 if(actor.role!=="administrator"||record.status!=="accepted"||record.publishedAt)throw new Error("Solo el administrador publica trabajos aceptados.");
 return {...record,publishedAt:at,events:[...record.events,{id:record.id+":"+record.events.length,workOrderId:record.workOrderId,at,actorId:actor.id,type:"published",note:"Publicación autorizada"}]};
}
export type EvidenceNotification={recipient:string;subject:string;body:string;recordId:string;eventType:"submission"|"publication"};
export function buildEvidenceNotification(recipient:string,record:EvidenceRecord,order:WorkOrder,eventType:EvidenceNotification["eventType"]):EvidenceNotification{
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))throw new Error("Destinatario no configurado o inválido.");
 if(record.workOrderId!==order.id)throw new Error("Orden inconsistente.");
 if(eventType==="publication"&&!record.publishedAt)throw new Error("No se notifican publicaciones no autorizadas.");
 return {recipient,recordId:record.id,eventType,subject:`ORBI Evidence · ${eventType==="submission"?"Entrega pendiente":"Evidencia publicada"} · ${order.id}`,body:`Sistema: ${order.systemName}. Orden: ${order.id}. Consulte el expediente mediante acceso autenticado; no se adjuntan archivos privados.`};
}
