import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {isPositiveRevision,isUuid,type ShiftAssignmentStatus} from "../../../../../data/operations-command-rules";
import {santiagoServiceDate} from "../../../../../data/shift-log-rules";

type ShiftRow={id:string;service_date:string;status:ShiftAssignmentStatus;assignee_staff_id:string|null;revision:number};
type LogRow={id:string;shift_assignment_id:string;state:"open"|"closed";opened_at:string;revision:number};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("write_shift_log");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{assignmentId?:unknown;expectedAssignmentRevision?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.assignmentId)||!isPositiveRevision(body.expectedAssignmentRevision))return NextResponse.json({error:"Comando inválido"},{status:400});

 const community=encodeURIComponent(identity.communityId);
 const assignmentId=encodeURIComponent(body.assignmentId);
 const shiftResponse=await operationsDbFetch(`shift_assignments?select=id,service_date,status,assignee_staff_id,revision&id=eq.${assignmentId}&community_id=eq.${community}&limit=1`,identity);
 if(!shiftResponse.ok)return NextResponse.json({error:"No se pudo consultar el turno"},{status:502});
 const shift=(await shiftResponse.json() as ShiftRow[])[0];
 if(!shift)return NextResponse.json({error:"Turno no encontrado"},{status:404});
 if(shift.revision!==body.expectedAssignmentRevision)return NextResponse.json({error:"El turno cambió; recarga antes de abrir la bitácora",currentRevision:shift.revision},{status:409});
 if(shift.service_date!==santiagoServiceDate())return NextResponse.json({error:"La bitácora solo puede abrirse para la jornada operativa de hoy"},{status:409});
 if(shift.status==="vacant"||shift.status==="requested"||!shift.assignee_staff_id)return NextResponse.json({error:"No se puede abrir una bitácora para un turno sin responsable confirmado o planificado"},{status:409});

 const existingResponse=await operationsDbFetch(`shift_logs?select=id,shift_assignment_id,state,opened_at,revision&community_id=eq.${community}&shift_assignment_id=eq.${assignmentId}&limit=1`,identity);
 if(!existingResponse.ok)return NextResponse.json({error:"No se pudo validar la bitácora"},{status:502});
 const existing=(await existingResponse.json() as LogRow[])[0];
 if(existing)return NextResponse.json({error:"Este turno ya tiene bitácora",log:existing},{status:409});

 const payload={community_id:identity.communityId,shift_assignment_id:shift.id,state:"open",opened_by:identity.id,updated_by:identity.id};
 const createResponse=await operationsDbFetch("shift_logs?select=id,shift_assignment_id,state,opened_at,revision",identity,{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
 if(!createResponse.ok)return NextResponse.json({error:createResponse.status===409?"Este turno ya tiene bitácora":"No se pudo abrir la bitácora"},{status:createResponse.status===409?409:400});
 const rows=await createResponse.json() as LogRow[];
 if(rows.length!==1)return NextResponse.json({error:"No se pudo confirmar la apertura"},{status:500});
 return NextResponse.json({ok:true,log:rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
}
