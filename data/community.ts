export type Status="scheduled"|"ondemand";
export const community={name:"Parque Ciudadano II",city:"Rancagua",tagline:"Tu comunidad, más clara. Más conectada.",systems:[
{icon:"🛗",name:"Ascensores",frequency:"Mensual",provider:"Atlagich Ascensores",status:"scheduled" as Status,note:"Mantención preventiva residencial"},
{icon:"💧",name:"Sala de Bombas",frequency:"Bimensual",provider:"Servicios Hidropotable",status:"scheduled" as Status,note:"Presurización y sistemas de bombeo"},
{icon:"⚡",name:"Grupo Electrógeno",frequency:"Por requerimiento",provider:"Por confirmar",status:"ondemand" as Status,note:"Respaldo energético del condominio"},
{icon:"🌿",name:"Jardín",frequency:"Mensual",provider:"Juan Figueroa",status:"scheduled" as Status,note:"Áreas verdes y entorno común"},
{icon:"🛡️",name:"Control de Plagas",frequency:"Mensual",provider:"APR Control de Plagas",status:"scheduled" as Status,note:"Prevención y control sanitario"},
{icon:"🏊",name:"Piscina",frequency:"Mensual",provider:"WS SpA",status:"scheduled" as Status,note:"Mantención de piscina"},
{icon:"📹",name:"CCDD · CCTV",frequency:"Trimestral",provider:"DC Servicios Integrales",status:"scheduled" as Status,note:"Seguridad y videovigilancia"},
{icon:"🌬️",name:"Presurización y Extracción",frequency:"Por requerimiento",provider:"Por confirmar",status:"ondemand" as Status,note:"Ventilación de espacios comunes"},
{icon:"🔥",name:"Sistema Contra Incendio",frequency:"Por requerimiento",provider:"Por confirmar",status:"ondemand" as Status,note:"Protección contra incendios"}],providers:[
{name:"Atlagich Ascensores",service:"Ascensores",verified:true,web:"https://atlagich.com/",detail:"Servicio residencial · atención 24/7"},
{name:"Servicios Hidropotable",service:"Sala de Bombas",verified:true,web:"https://hidropotable.cl/",detail:"Bombas · presurización · mantención"},
{name:"APR Control de Plagas",service:"Control de plagas",verified:false,detail:"Identidad web pendiente de validación"},
{name:"WS SpA",service:"Piscina",verified:false,detail:"Identidad web pendiente de validación"},
{name:"DC Servicios Integrales",service:"CCDD · CCTV",verified:false,detail:"Identidad web pendiente de validación"}],certifications:[
{icon:"📋",name:"Plan de Emergencia",frequency:"Anual",state:"Actualizar 04-2026"},
{icon:"🧯",name:"Extintores",frequency:"Anual",state:"Mantención 09-2027"},
{icon:"🛗",name:"Certificación Ascensores",frequency:"Anual",state:"En proceso de certificación"},
{icon:"💧",name:"Estanques",frequency:"Anual",state:"Realizar 05-2026"}]};