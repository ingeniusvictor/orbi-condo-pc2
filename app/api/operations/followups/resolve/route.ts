import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";
import {isPositiveRevision,isUuid} from "../../../../../data/operations-command-rules";
import {isOperationalFollowupResolution} from "../../../../../data/operational-followup-rules";

type FollowupRow={id:string;state:"open"|"acknowledged"|"resolved";revision:number};

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});
 const identity=await requireOperationPermission("manage_operational_followup");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403});
 let body:{followupId?:unknown;expectedRevision?:unknown;resolutionCode?:unknown};
 try{body=await req.json()}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400})}
 if(!isUuid(body.followupId)||!isPositiveRevision(body.expectedRevision)||!isOperationalFollowupResolution(body.resolutionCode))return NextResponse.json({error:"Comando inválido"},{status:400});
 const community=encodeURIComponent(identity.communityId);const id=encodeURIComponent(body.followupId);
 const currentResponse=await operationsDbFetch(`operational_followups?select=id,state,revision&id=eq.${id}&community_id=eq.${community}&limit=1`,identity);
 if(!currentResponse.ok)return NextResponse.json({error:"No se pudo consultar el pendiente"},{status:502});
 const current=(await currentResponse.json() as FollowupRow[])[0];
 if(!current)return NextResponse.json({error:"Pendiente no encontrado"},{status:404});
 if(current.revision!==body.expectedRevision)return NextResponse.json({error:"El pendiente cambió; recarga antes de resolver",currentRevision:current.revision},{status:409});
 if(current.state!=="acknowledged")return NextResponse.json({error:"El pendiente debe estar reconocido antes de resolverse"},{status:409});
 const update={state:"resolved",resolved_by:identity.id,resolved_at:new Date().toISOString(),resolution_code:body.resolutionCode,updated_by:identity.id};
 const response=await operationsDbFetch(`operational_followups?id=eq.${id}&community_id=eq.${community}&state=eq.acknowledged&revision=eq.${body.expectedRevision}&select=id,state,resolved_at,resolution_code,revision,updated_at`,identity,{method:"PATCH",headers:{"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(update)});
 if(!response.ok)return NextResponse.json({error:"No se pudo resolver el pendiente"},{status:400});
 const rows=await response.json() as unknown[];
 if(rows.length!==1)return NextResponse.json({error:"Conflicto de edición; recarga el pendiente"},{status:409});
 return NextResponse.json({ok:true,followup:rows[0]},{headers:{"Cache-Control":"no-store"}});
}
