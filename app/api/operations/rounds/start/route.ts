import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {isUuid} from "../../../../../data/operations-command-rules";
import {isOperationalRoundType} from "../../../../../data/operational-round-rules";
import {santiagoServiceDate} from "../../../../../data/shift-log-rules";

type LogRow={id:string;shift_assignment_id:string;state:"open"|"closed"};
type ShiftRow={id:string;service_date:string};
type RoundRow={id:string;shift_log_id:string;round_type:string;state:string;started_at:string;revision:number};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("write_operational_round");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{shiftLogId?:unknown;roundType?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.shiftLogId)||!isOperationalRoundType(body.roundType))return NextResponse.json({error:"Ronda inválida"},{status:400});
 const community=encodeURIComponent(identity.communityId);
 const logId=encodeURIComponent(body.shiftLogId);
 const logResponse=await operationsDbFetch(`shift_logs?select=id,shift_assignment_id,state&id=eq.${logId}&community_id=eq.${community}&limit=1`,identity);
 if(!logResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502});
 const log=(await logResponse.json() as LogRow[])[0];
 if(!log)return NextResponse.json({error:"Bitácora no encontrada"},{status:404});
 if(log.state!=="open")return NextResponse.json({error:"La ronda requiere una bitácora de turno abierta"},{status:409});
 const shiftResponse=await operationsDbFetch(`shift_assignments?select=id,service_date&id=eq.${encodeURIComponent(log.shift_assignment_id)}&community_id=eq.${community}&limit=1`,identity);
 if(!shiftResponse.ok)return NextResponse.json({error:"No se pudo validar el turno"},{status:502});
 const shift=(await shiftResponse.json() as ShiftRow[])[0];
 if(!shift||shift.service_date!==santiagoServiceDate())return NextResponse.json({error:"Las rondas nuevas solo pueden iniciarse en la jornada operativa de hoy"},{status:409});
 const existingResponse=await operationsDbFetch(`operational_rounds?select=id&community_id=eq.${community}&shift_log_id=eq.${logId}&state=eq.open&limit=1`,identity);
 if(!existingResponse.ok)return NextResponse.json({error:"No se pudo validar la ronda"},{status:502});
 if((await existingResponse.json() as {id:string}[]).length)return NextResponse.json({error:"Ya existe una ronda abierta para esta bitácora"},{status:409});
 const payload={community_id:identity.communityId,shift_log_id:log.id,round_type:body.roundType,state:"open",started_by:identity.id,updated_by:identity.id};
 const response=await operationsDbFetch("operational_rounds?select=id,shift_log_id,round_type,state,started_at,revision",identity,{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
 if(!response.ok)return NextResponse.json({error:"No se pudo iniciar la ronda"},{status:response.status===409?409:400});
 const rows=await response.json() as RoundRow[];
 if(rows.length!==1)return NextResponse.json({error:"No se pudo confirmar la ronda"},{status:500});
 return NextResponse.json({ok:true,round:rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
}
