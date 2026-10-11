import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {isPositiveRevision,isUuid} from "../../../../../data/operations-command-rules";

type RoundRow={id:string;state:"open"|"completed";revision:number};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("complete_operational_round");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{roundId?:unknown;expectedRevision?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.roundId)||!isPositiveRevision(body.expectedRevision))return NextResponse.json({error:"Comando inválido"},{status:400});
 const community=encodeURIComponent(identity.communityId);
 const roundId=encodeURIComponent(body.roundId);
 const currentResponse=await operationsDbFetch(`operational_rounds?select=id,state,revision&id=eq.${roundId}&community_id=eq.${community}&limit=1`,identity);
 if(!currentResponse.ok)return NextResponse.json({error:"No se pudo consultar la ronda"},{status:502});
 const current=(await currentResponse.json() as RoundRow[])[0];
 if(!current)return NextResponse.json({error:"Ronda no encontrada"},{status:404});
 if(current.revision!==body.expectedRevision)return NextResponse.json({error:"La ronda cambió; recarga antes de completar",currentRevision:current.revision},{status:409});
 if(current.state!=="open")return NextResponse.json({error:"La ronda ya está completada"},{status:409});
 const checksResponse=await operationsDbFetch(`operational_round_checks?select=id&round_id=eq.${roundId}&community_id=eq.${community}&limit=1`,identity);
 if(!checksResponse.ok)return NextResponse.json({error:"No se pudieron validar los checkpoints"},{status:502});
 if(!(await checksResponse.json() as {id:string}[]).length)return NextResponse.json({error:"Registra al menos un checkpoint antes de completar la ronda"},{status:409});
 const update={state:"completed",completed_by:identity.id,completed_at:new Date().toISOString(),updated_by:identity.id};
 const response=await operationsDbFetch(`operational_rounds?id=eq.${roundId}&community_id=eq.${community}&state=eq.open&revision=eq.${body.expectedRevision}&select=id,state,completed_at,revision,updated_at`,identity,{method:"PATCH",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(update)});
 if(!response.ok)return NextResponse.json({error:"No se pudo completar la ronda"},{status:response.status===409?409:400});
 const rows=await response.json() as unknown[];
 if(rows.length!==1)return NextResponse.json({error:"Conflicto de edición; recarga la ronda"},{status:409});
 return NextResponse.json({ok:true,round:rows[0]},{headers:{"Cache-Control":"no-store"}});
}
