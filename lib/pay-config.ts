export type PaymentConfig={recipientEmail:string;administrationName:string;bankName:string;accountHolder:string;accountNumber:string;accountType:string;updatedAt:string;version:number};
export type ConfigProposal={id:string;proposedBy:string;next:Omit<PaymentConfig,"updatedAt"|"version">;reason:string;reviewedBy?:string;reviewStatus:"pending"|"approved"|"rejected";};
export type PaymentConfigAudit={actorId:string;proposalId:string;changedFields:string[];occurredAt:string;previousVersion:number;newVersion:number};
export function validatePaymentConfig(input:Omit<PaymentConfig,"updatedAt"|"version">):string[]{
 const errors:string[]=[];
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.recipientEmail)||input.recipientEmail.length>254)errors.push("Correo destinatario inválido.");
 if(!input.administrationName.trim()||input.administrationName.length>100)errors.push("Nombre de administración inválido.");
 if(!input.bankName.trim()||input.bankName.length>100)errors.push("Nombre de banco inválido.");
 if(!input.accountHolder.trim()||input.accountHolder.length>120)errors.push("Titular inválido.");
 if(!/^[0-9-]{4,30}$/.test(input.accountNumber))errors.push("Número de cuenta inválido.");
 if(!input.accountType.trim()||input.accountType.length>50)errors.push("Tipo de cuenta inválido.");
 return errors;
}
export function changedPaymentFields(previous:PaymentConfig,next:ConfigProposal["next"]):string[]{
 return (["recipientEmail","administrationName","bankName","accountHolder","accountNumber","accountType"] as const).filter(k=>previous[k]!==next[k]);
}
export function executeApprovedPaymentConfig(previous:PaymentConfig,proposal:ConfigProposal,actor:{id:string;role:"administrator"|"committee"|"resident"},emailVerified:boolean,now:string):{config:PaymentConfig;audit:PaymentConfigAudit}{
 if(actor.role!=="administrator")throw new Error("Solo el administrador ejecuta cambios oficiales.");
 if(proposal.reviewStatus!=="approved"||!proposal.reviewedBy)throw new Error("Requiere aprobación del comité para cambios bancarios y de destinatario.");
 if(!emailVerified)throw new Error("El nuevo correo receptor debe estar verificado.");
 const errors=validatePaymentConfig(proposal.next);if(errors.length)throw new Error(errors.join(" "));
 const changedFields=changedPaymentFields(previous,proposal.next);
 if(!changedFields.length)throw new Error("Sin cambios para aplicar.");
 const config:PaymentConfig={...proposal.next,version:previous.version+1,updatedAt:now};
 return {config,audit:{actorId:actor.id,proposalId:proposal.id,changedFields,occurredAt:now,previousVersion:previous.version,newVersion:config.version}};
}
