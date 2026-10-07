import type {Community} from "./types";

export const community={
 slug:"parque-ciudadano-ii",
 name:"Parque Ciudadano II",
 city:"Rancagua",
 region:"O’Higgins",
 tagline:"Tu comunidad, más clara. Más conectada.",
 housingCount:278,
 housingProgram:"DS19",
 publicProjectCode:"153778",
 systems:[
  {name:"Ascensores",frequency:"Mensual",provider:"Atlagich Ascensores",status:"scheduled",note:"Mantención preventiva residencial"},
  {name:"Sala de Bombas",frequency:"Bimensual",provider:"Servicios Hidropotable",status:"scheduled",note:"Presurización y sistemas de bombeo"},
  {name:"Grupo Electrógeno",frequency:"Por requerimiento",provider:"Por confirmar",status:"ondemand",note:"Respaldo energético del condominio"},
  {name:"Jardín",frequency:"Mensual",provider:"Juan Figueroa",status:"scheduled",note:"Áreas verdes y entorno común"},
  {name:"Control de Plagas",frequency:"Mensual",provider:"APR Control de Plagas",status:"scheduled",note:"Prevención y control sanitario"},
  {name:"Piscina",frequency:"Mensual",provider:"WS SpA",status:"scheduled",note:"Mantención de piscina"},
  {name:"CCDD · CCTV",frequency:"Trimestral",provider:"DC Servicios Integrales",status:"scheduled",note:"Seguridad y videovigilancia"},
  {name:"Presurización y Extracción",frequency:"Por requerimiento",provider:"Por confirmar",status:"ondemand",note:"Ventilación de espacios comunes"},
  {name:"Sistema Contra Incendio",frequency:"Por requerimiento",provider:"Por confirmar",status:"ondemand",note:"Protección contra incendios"}
 ],
 providers:[
  {name:"Atlagich Ascensores",service:"Ascensores",verified:true,web:"https://atlagich.com/",detail:"Mantención residencial · emergencias 24/7"},
  {name:"Servicios Hidropotable",service:"Sala de Bombas",verified:true,web:"https://hidropotable.cl/",detail:"Presurización · bombeo · mantención hidráulica"},
  {name:"APR Control de Plagas",service:"Control de plagas",verified:true,web:"https://www.aprplagas.cl/",detail:"Control integrado de plagas · Rancagua"},
  {name:"WS SpA · ORCA Piscinas",service:"Piscina",verified:true,web:"https://www.orcapiscinas.cl/",detail:"Mantención de piscinas · equipos · servicio técnico"},
  {name:"DC Servicios Integrales SpA",service:"CCDD · CCTV",verified:true,detail:"CCTV · alarmas · control de acceso · corrientes débiles"}
 ],
 certifications:[
  {icon:"📋",name:"Plan de Emergencia",frequency:"Anual",state:"Actualizar 04-2026"},
  {icon:"🧯",name:"Extintores",frequency:"Anual",state:"Mantención 09-2027"},
  {icon:"🛗",name:"Certificación Ascensores",frequency:"Anual",state:"En proceso de certificación"},
  {icon:"💧",name:"Estanques",frequency:"Anual",state:"Realizar 05-2026"}
 ],
 amenities:["Piscina","Patio / Jardín","Zona juegos","Sala multiuso","Bicicleteros","Quincho","Estacionamientos","Portería","Terraza","Zona reciclaje","Máquinas de ejercicio"]
} satisfies Community;
