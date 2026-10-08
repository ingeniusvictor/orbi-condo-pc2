export type EvidenceStatus="submitted"|"needs_changes"|"reviewed"|"accepted";
export type EvidenceFile={name:string;size:number;type:string;kind:"photo"|"report"};
export type EvidenceSubmission={id:string;workOrderId:string;contractorName:string;area:string;asset:string;performedAt:string;summary:string;files:EvidenceFile[];status:EvidenceStatus};
export const EVIDENCE_MAX_FILE_BYTES=10*1024*1024;
export const EVIDENCE_MAX_FILES=12;
export const EVIDENCE_ALLOWED_TYPES=["image/jpeg","image/png","image/webp","application/pdf"] as const;
export function validateEvidenceFiles(files:Pick<File,"name"|"size"|"type">[]):string[]{
 const errors:string[]=[];
 if(!files.length)errors.push("Adjunta al menos una fotografía o informe.");
 if(files.length>EVIDENCE_MAX_FILES)errors.push("Máximo 12 archivos por entrega.");
 for(const file of files){
  if(!EVIDENCE_ALLOWED_TYPES.includes(file.type as typeof EVIDENCE_ALLOWED_TYPES[number]))errors.push("Formato no permitido: "+file.name);
  if(file.size<1||file.size>EVIDENCE_MAX_FILE_BYTES)errors.push("Archivo vacío o superior a 10 MB: "+file.name);
 }
 return errors;
}
export function validateEvidenceMetadata(input:Pick<EvidenceSubmission,"workOrderId"|"contractorName"|"area"|"asset"|"performedAt"|"summary">):string[]{
 const errors:string[]=[];
 for(const [key,value] of Object.entries(input)){if(!value.trim()||value.length>500)errors.push("Campo obligatorio o demasiado extenso: "+key);}
 return errors;
}
export function canTransitionEvidence(from:EvidenceStatus,to:EvidenceStatus,role:"administrator"|"committee"|"resident"):boolean{
 if(role!=="administrator")return false;
 return (from==="submitted"&&(to==="needs_changes"||to==="reviewed"))||(from==="needs_changes"&&to==="reviewed")||(from==="reviewed"&&(to==="accepted"||to==="needs_changes"));
}
