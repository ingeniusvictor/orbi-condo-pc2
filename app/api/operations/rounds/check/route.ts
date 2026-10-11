import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {isUuid} from "../../../../../data/operations-command-rules";
import {isOperationalCaseReference,isOperationalCheckpoint,isOperationalCheckResult} from "../../../../../data/operational-round-rules";

type RoundRow={id:string;state:"open"|"completed"};
type IncidentRow={id:string};
type CheckRow={id:string;round_id:string;checkpoint_code:string;result:string;incident_id:string|null;case_reference:string|null;created_at:string};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("write_operational_round");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{roundId?:unknown;checkpointCode?:unknown;result?:unknown;incidentId?:unknown;caseReference?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.roundId)||!isOperationalCheckpoint(body.checkpointCode)||!isOperationalCheckResult(body.result))return NextResponse.json({error:"Checkpoint inválido"},{status:400});
 const incidentId=body.incidentId===undefined||body.incidentId===null||body.incidentId===""?null:body.incidentId;
 const caseReference=body.caseReference===undefined||body.caseReference===null||body.caseReference===""?null:body.caseReference;
 if(incidentId!==null&&!isUuid(incidentId))return NextResponse.json({error:"Incidencia vinculada inválida"},{status:400});
 if(caseReference!==null&&!isOperationalCaseReference(caseReference))return NextResponse.json({error:"Referencia inválida"},{status:400});
 if(body.result==="attention"&&incidentId===null&&caseReference===null)return NextResponse.json({error:"Un checkpoint en atención requiere incidencia o referencia sintética"},{status:400});
 if(body.result!=="attention"&&incidentId!==null)return NextResponse.json({error:"Solo un checkpoint en atención puede vincular una incidencia"},{status:400});
 const community=encodeURIComponent(identity.communityId);
 const roundId=encodeURIComponent(body.roundId);
 const roundResponse=await operationsDbFetch(`operational_rounds?select=id,state&id=eq.${roundId}&community_id=eq.${community}&limit=1`,identity);
 if(!roundResponse.ok)return NextResponse.json({error:"No se pudo consultar la ronda"},{status:502});
 const round=(await roundResponse.json() as RoundRow[])[0];
 if(!round)return NextResponse.json({error:"Ronda no encontrada"},{status:404});
 if(round.state!=="open")return NextResponse.json({error:"La ronda ya está completada"},{status:409});
 if(incidentId!==null){
  const incidentResponse=await operationsDbFetch(`incidents?select=id&id=eq.${encodeURIComponent(incidentId)}&community_id=eq.${community}&limit=1`,identity);
  if(!incidentResponse.ok)return NextResponse.json({error:"No se pudo validar la incidencia"},{status:502});
  const incident=(await incidentResponse.json() as IncidentRow[])[0];
  if(!incident)return NextResponse.json({error:"Incidencia vinculada no encontrada"},{status:404});
 }
 const duplicateResponse=await operationsDbFetch(`operational_round_checks?select=id&round_id=eq.${roundId}&checkpoint_code=eq.${encodeURIComponent(body.checkpointCode)}&community_id=eq.${community}&limit=1`,identity);
 if(!duplicateResponse.ok)return NextResponse.json({error:"No se pudo validar el checkpoint"},{status:502});
 if((await duplicateResponse.json() as {id:string}[]).length)return NextResponse.json({error:"Este checkpoint ya fue registrado en la ronda"},{status:409});
 const payload={community_id:identity.communityId,round_id:round.id,checkpoint_code:body.checkpointCode,result:body.result,incident_id:incidentId,case_reference:caseReference,actor_user_id:identity.id};
 const createResponse=await operationsDbFetch("operational_round_checks?select=id,round_id,checkpoint_code,result,incident_id,case_reference,created_at",identity,{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(payload)});
 if(!createResponse.ok)return NextResponse.json({error:"No se pudo registrar el checkpoint"},{status:createResponse.status===409?409:400});
 const rows=await createResponse.json() as CheckRow[];
 if(rows.length!==1)return NextResponse.json({error:"No se pudo confirmar el checkpoint"},{status:500});
 return NextResponse.json({ok:true,check:rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
}
