import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission,trustedOrigin} from "../../../../../lib/server/operations-auth";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const syntheticParty=/^SINT-[A-Za-z0-9 _-]{1,80}$/;
const syntheticUnit=/^DEMO-[A-Za-z0-9-]{1,32}$/;
const syntheticVehicle=/^DEMO-[A-Za-z0-9-]{1,20}$/;

type CommandBody={
 assetId?:unknown;
 expectedRevision?:unknown;
 linkedUnitCode?:unknown;
 ownerLabel?:unknown;
 tenantLabel?:unknown;
 vehicleReference?:unknown;
 markReview?:unknown;
};

function optionalString(value:unknown,max:number){return value===null||value===undefined||value===""?null:typeof value==="string"&&value.trim().length<=max?value.trim():undefined;}

export async function POST(req:Request){
 if(!trustedOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 const identity=await requireOperationPermission("manage_parking");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 let body:CommandBody;
 try{body=await req.json() as CommandBody;}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400});}
 if(typeof body.assetId!=="string"||!uuid.test(body.assetId))return NextResponse.json({error:"Estacionamiento inválido"},{status:400});
 if(typeof body.expectedRevision!=="number"||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<1)return NextResponse.json({error:"Revisión inválida"},{status:400});
 const linkedUnitCode=optionalString(body.linkedUnitCode,40);
 const ownerLabel=optionalString(body.ownerLabel,96);
 const tenantLabel=optionalString(body.tenantLabel,96);
 const vehicleReference=optionalString(body.vehicleReference,32);
 if(linkedUnitCode===undefined||ownerLabel===undefined||tenantLabel===undefined||vehicleReference===undefined)return NextResponse.json({error:"Campos inválidos"},{status:400});
 if(linkedUnitCode&&!syntheticUnit.test(linkedUnitCode))return NextResponse.json({error:"Staging sólo acepta unidades DEMO-*"},{status:400});
 if(ownerLabel&&!syntheticParty.test(ownerLabel))return NextResponse.json({error:"Staging sólo acepta alias de propietario SINT-*"},{status:400});
 if(tenantLabel&&!syntheticParty.test(tenantLabel))return NextResponse.json({error:"Staging sólo acepta alias de arrendatario SINT-*"},{status:400});
 if(vehicleReference&&!syntheticVehicle.test(vehicleReference))return NextResponse.json({error:"Staging sólo acepta vehículos DEMO-*"},{status:400});
 if(body.markReview!==undefined&&typeof body.markReview!=="boolean")return NextResponse.json({error:"Estado de revisión inválido"},{status:400});

 const response=await operationsDbFetch("rpc/command_parking_assignment",identity,{
  method:"POST",
  headers:{"Content-Type":"application/json","Prefer":"return=representation"},
  body:JSON.stringify({
   p_community_id:identity.communityId,
   p_asset_id:body.assetId,
   p_expected_revision:body.expectedRevision,
   p_linked_unit_code:linkedUnitCode,
   p_owner_label:ownerLabel,
   p_tenant_label:tenantLabel,
   p_vehicle_reference:vehicleReference,
   p_mark_review:body.markReview===true,
  }),
 });
 if(!response.ok){
  let upstream:{code?:string;message?:string}={};
  try{upstream=await response.json() as {code?:string;message?:string};}catch{}
  if(upstream.code==="40001"||upstream.message?.includes("parking_revision_conflict"))return NextResponse.json({error:"El estacionamiento cambió; recarga antes de guardar"},{status:409});
  if(upstream.code==="P0002"||upstream.message?.includes("parking_asset_not_found"))return NextResponse.json({error:"Estacionamiento no encontrado"},{status:404});
  if(upstream.code==="42501")return NextResponse.json({error:"No autorizado"},{status:403});
  return NextResponse.json({error:"No se pudo actualizar la relación del estacionamiento"},{status:400});
 }
 const rows=await response.json() as {asset_id:string;new_revision:number;new_status:string}[];
 if(rows.length!==1)return NextResponse.json({error:"Respuesta de actualización inválida"},{status:502});
 return NextResponse.json({ok:true,assetId:rows[0].asset_id,revision:rows[0].new_revision,status:rows[0].new_status},{headers:{"Cache-Control":"private, no-store"}});
}
