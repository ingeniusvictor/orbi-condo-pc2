export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PROOF_TYPES = ["image/jpeg","image/png","image/webp","application/pdf"] as const;
export function validateUnit(value:string):string|null {
 const unit=value.trim();
 if(!/^[a-zA-Z0-9][a-zA-Z0-9 -]{0,19}$/.test(unit))return "Ingresa un departamento válido (hasta 20 caracteres).";
 return null;
}
export function validateProof(file:Pick<File,"size"|"type">|null):string|null {
 if(!file)return "Adjunta una foto o PDF del comprobante.";
 if(!ACCEPTED_PROOF_TYPES.includes(file.type as typeof ACCEPTED_PROOF_TYPES[number]))return "Solo se aceptan JPG, PNG, WEBP o PDF.";
 if(file.size===0||file.size>MAX_PROOF_BYTES)return "El archivo debe pesar entre 1 byte y 5 MB.";
 return null;
}
