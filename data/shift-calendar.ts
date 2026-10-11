/** Feriados nacionales Chile 2026, fuente: gob.cl/noticias/feriados-2026-revisa-cuantos-habra-y-cuales-son-irrenunciables/ */
export const NATIONAL_HOLIDAYS_2026: Readonly<Record<string,string>> = {
 "2026-01-01":"Año Nuevo","2026-04-03":"Viernes Santo","2026-04-04":"Sábado Santo",
 "2026-05-01":"Día del Trabajo","2026-05-21":"Glorias Navales",
 "2026-06-21":"Día Nacional de los Pueblos Indígenas","2026-06-29":"San Pedro y San Pablo",
 "2026-07-16":"Virgen del Carmen","2026-08-15":"Asunción de la Virgen",
 "2026-09-18":"Independencia Nacional","2026-09-19":"Glorias del Ejército",
 "2026-10-12":"Encuentro de Dos Mundos","2026-10-31":"Día de las Iglesias Evangélicas",
 "2026-11-01":"Todos los Santos","2026-12-08":"Inmaculada Concepción",
 "2026-12-25":"Navidad"
};
export type ShiftRole="fixed1"|"fixed2"|"fixed3"|"part1"|"part2"|"relief1"|"relief2";
export type ShiftStatus="planned"|"vacant"|"requested"|"confirmed"|"received";
export type ShiftSlot={id:string;label:string;start:string;end:string;defaultRole:ShiftRole|null;nextDay:boolean;validation:"reported"|"inferred_unverified"};
export type ShiftOverride={role:ShiftRole|null;status:ShiftStatus;note:string;updatedAt:string};
export type ShiftOverrideMap=Record<string,ShiftOverride>;
export const ROLE_LABELS:Record<ShiftRole,string>={
 fixed1:"Conserje fijo 1",fixed2:"Conserje fijo 2",fixed3:"Conserje fijo 3",
 part1:"Part-time 1",part2:"Part-time 2",relief1:"Suplente 1",relief2:"Suplente 2"
};
export function isISODate(date:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const [y,m,d]=date.split("-").map(Number);
 const parsed=new Date(Date.UTC(y,m-1,d));
 return parsed.getUTCFullYear()===y&&parsed.getUTCMonth()+1===m&&parsed.getUTCDate()===d;
}
export function isSpecialDate(date:string):boolean{
 if(!isISODate(date))return false;
 const [y,m,d]=date.split("-").map(Number);
 return new Date(Date.UTC(y,m-1,d)).getUTCDay()===0 || Boolean(NATIONAL_HOLIDAYS_2026[date]);
}
export function shiftSlotsForDate(date:string):ShiftSlot[]{
 if(isSpecialDate(date))return [
 {id:"special-day",label:"Part-time diurno",start:"08:00",end:"20:00",defaultRole:"part1",nextDay:false,validation:"reported"},
 {id:"special-night",label:"Cobertura nocturna especial · por validar",start:"20:00",end:"08:00",defaultRole:null,nextDay:true,validation:"inferred_unverified"}
 ];
 return [
 {id:"morning",label:"Mañana",start:"07:00",end:"14:30",defaultRole:"fixed1",nextDay:false,validation:"reported"},
 {id:"afternoon",label:"Tarde",start:"14:30",end:"22:00",defaultRole:"fixed2",nextDay:false,validation:"reported"},
 {id:"night",label:"Noche",start:"22:00",end:"07:00",defaultRole:"fixed3",nextDay:true,validation:"reported"}
 ];
}
export const shiftKey=(date:string,id:string)=>date+"|"+id;
export function parseOverrides(raw:string|null):ShiftOverrideMap{
 if(!raw)return {};
 try{
  const data:unknown=JSON.parse(raw);
  if(!data||typeof data!=="object"||Array.isArray(data))return {};
  const result:ShiftOverrideMap={};
  for(const [key,value] of Object.entries(data)){
   if(!/^\d{4}-\d{2}-\d{2}\|[a-z-]+$/.test(key)||!value||typeof value!=="object")continue;
   const item=value as Partial<ShiftOverride>;
   if(item.role!==null&&!(typeof item.role==="string"&&item.role in ROLE_LABELS))continue;
   if(!["planned","vacant","requested","confirmed","received"].includes(String(item.status)))continue;
   result[key]={role:item.role??null,status:item.status as ShiftStatus,note:typeof item.note==="string"?item.note.slice(0,140):"",updatedAt:typeof item.updatedAt==="string"?item.updatedAt:""};
  }
  return result;
 }catch{return {};}
}
