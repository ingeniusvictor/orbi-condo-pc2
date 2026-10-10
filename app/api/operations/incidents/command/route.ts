import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {canTransitionIncidentCommand,isIncidentCommandState,isPositiveRevision,isUuid,type IncidentCommandState} from "../../../../../data/operations-command-rules";

const priorities=["low","medium","high","critical"] as const;
const roles=["administrator","committee","concierge","mayordomo"] as const;
type Priority=typeof priorities[number];
type AssignedRole=typeof roles[number];
type IncidentRow={id:string;state:IncidentCommandState;priority:Priority;assigned_role:AssignedRole|null;revision:number};
const isPriority=(value:unknown):value is Priority=>typeof value==="string"&&(priorities as readonly string[]).includes(value);
const isAssignedRole=(value:unknown):value is AssignedRole=>typeof value==="string"&&(roles as readonly string[]).includes(value);

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("manage_incident");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{incidentId?:unknown;expectedRevision?:unknown;nextState?:unknown;priority?:unknown;assignedRole?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.incidentId)||!isPositiveRevision(body.expectedRevision))return NextResponse.json({error:"Comando inválido"},{status:400});
 const hasState=body.nextState!==undefined;
 const hasPriority=body.priority!==undefined;
 const hasAssignedRole=Object.prototype.hasOwnProperty.call(body,"assignedRole");
 if(!hasState&&!hasPriority&&!hasAssignedRole)return NextResponse.json({error:"No hay cambios solicitados"},{status:400});
 if(hasState&&!isIncidentCommandState(body.nextState))return NextResponse.json({error:"Estado inválido"},{status:400});
 if(hasPriority&&!isPriority(body.priority))return NextResponse.json({error:"Prioridad inválida"},{status:400});
 if(hasAssignedRole&&body.assignedRole!==null&&!isAssignedRole(body.assignedRole))return NextResponse.json({error:"Responsable inválido"},{status:400});
 const currentResponse=await operationsDbFetch(`incidents?select=id,state,priority,assigned_role,revision&id=eq.${encodeURIComponent(body.incidentId)}&community_id=eq.${encodeURIComponent(identity.communityId)}&limit=1`,identity);
 if(!currentResponse.ok)return NextResponse.json({error:"No se pudo consultar la incidencia"},{status:502});
 const current=(await currentResponse.json() as IncidentRow[])[0];
 if(!current)return NextResponse.json({error:"Incidencia no encontrada"},{status:404});
 if(current.revision!==body.expectedRevision)return NextResponse.json({error:"La incidencia cambió; recarga antes de continuar",currentRevision:current.revision},{status:409});
 if(hasState&&!canTransitionIncidentCommand(current.state,body.nextState as IncidentCommandState))return NextResponse.json({error:"Transición de incidencia no permitida"},{status:409});
 const patch:{updated_by:string;state?:IncidentCommandState;priority?:Priority;assigned_role?:AssignedRole|null}={updated_by:identity.id};
 if(hasState)patch.state=body.nextState as IncidentCommandState;
 if(hasPriority)patch.priority=body.priority as Priority;
 if(hasAssignedRole)patch.assigned_role=body.assignedRole as AssignedRole|null;
 const response=await operationsDbFetch(`incidents?id=eq.${encodeURIComponent(body.incidentId)}&community_id=eq.${encodeURIComponent(identity.communityId)}&revision=eq.${body.expectedRevision}&select=id,state,priority,assigned_role,revision,updated_at`,identity,{method:"PATCH",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(patch)});
 if(!response.ok)return NextResponse.json({error:"No se pudo aplicar el cambio"},{status:response.status===409?409:400});
 const rows=await response.json() as unknown[];
 if(rows.length!==1)return NextResponse.json({error:"Conflicto de edición; recarga la incidencia"},{status:409});
 return NextResponse.json({ok:true,incident:rows[0]},{headers:{"Cache-Control":"no-store"}});
}
