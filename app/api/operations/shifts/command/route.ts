import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {canTransitionShift,isPositiveRevision,isShiftAssignmentStatus,isUuid,shiftStatusRequiresAssignee,type ShiftAssignmentStatus} from "../../../../../data/operations-command-rules";

type ShiftRow={id:string;status:ShiftAssignmentStatus;assignee_staff_id:string|null;revision:number};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("manage_shift_schedule");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{assignmentId?:unknown;expectedRevision?:unknown;nextStatus?:unknown;assigneeStaffId?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.assignmentId)||!isPositiveRevision(body.expectedRevision)||!isShiftAssignmentStatus(body.nextStatus))return NextResponse.json({error:"Comando inválido"},{status:400});
 const hasAssignee=Object.prototype.hasOwnProperty.call(body,"assigneeStaffId");
 if(hasAssignee&&body.assigneeStaffId!==null&&!isUuid(body.assigneeStaffId))return NextResponse.json({error:"Suplente inválido"},{status:400});

 const currentResponse=await operationsDbFetch(`shift_assignments?select=id,status,assignee_staff_id,revision&id=eq.${encodeURIComponent(body.assignmentId)}&community_id=eq.${encodeURIComponent(identity.communityId)}&limit=1`,identity);
 if(!currentResponse.ok)return NextResponse.json({error:"No se pudo consultar el turno"},{status:502});
 const current=(await currentResponse.json() as ShiftRow[])[0];
 if(!current)return NextResponse.json({error:"Turno no encontrado"},{status:404});
 if(current.revision!==body.expectedRevision)return NextResponse.json({error:"El turno cambió; recarga antes de continuar",currentRevision:current.revision},{status:409});
 if(!canTransitionShift(current.status,body.nextStatus))return NextResponse.json({error:"Transición de turno no permitida"},{status:409});

 const effectiveAssignee=body.nextStatus==="vacant"?null:(hasAssignee?body.assigneeStaffId as string|null:current.assignee_staff_id);
 if(shiftStatusRequiresAssignee(body.nextStatus)&&!effectiveAssignee)return NextResponse.json({error:"El estado requiere una persona asignada"},{status:400});
 const patch:{status:ShiftAssignmentStatus;updated_by:string;assignee_staff_id?:string|null}={status:body.nextStatus,updated_by:identity.id};
 if(body.nextStatus==="vacant"||hasAssignee)patch.assignee_staff_id=effectiveAssignee;
 const updateResponse=await operationsDbFetch(`shift_assignments?id=eq.${encodeURIComponent(body.assignmentId)}&community_id=eq.${encodeURIComponent(identity.communityId)}&revision=eq.${body.expectedRevision}&select=id,status,assignee_staff_id,revision,updated_at`,identity,{method:"PATCH",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(patch)});
 if(!updateResponse.ok)return NextResponse.json({error:"No se pudo aplicar el cambio"},{status:updateResponse.status===409?409:400});
 const rows=await updateResponse.json() as unknown[];
 if(rows.length!==1)return NextResponse.json({error:"Conflicto de edición; recarga el turno"},{status:409});
 return NextResponse.json({ok:true,assignment:rows[0]},{headers:{"Cache-Control":"no-store"}});
}
