import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission} from "../../../../../lib/server/operations-auth";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AssetRow={id:string;asset_code:string;parking_level:"exterior"|"subterranean";parking_class:"resident"|"visit"|"commercial";zone_code:string|null;status:string;linked_unit_code:string|null};
type OccupancyRow={id:string;relationship:"owner"|"tenant"|"authorized_user"|"loaned";party_reference_id:string;vehicle_reference:string|null;valid_from:string;valid_until:string|null;active:boolean;created_at:string;updated_at:string};
type PartyRow={id:string;display_name:string;unit_code:string|null};

function canonicalCode(raw:string){
 const value=raw.trim().toUpperCase();
 if(/^\d{1,3}$/.test(value)){
  const number=Number(value);
  if(number>=1&&number<=72)return `E${number}`;
  if(number>=73&&number<=182)return String(number);
 }
 const visit=value.match(/^V0?([12])$/);if(visit)return `V0${visit[1]}`;
 const commercial=value.match(/^LC0?([12])$/);if(commercial)return `LC0${commercial[1]}`;
 return value;
}

export async function GET(req:Request){
 const identity=await requireOperationPermission("manage_parking");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 const url=new URL(req.url);
 const raw=(url.searchParams.get("q")||"").trim().slice(0,40);
 const assetId=(url.searchParams.get("assetId")||"").trim();
 if(!raw&&!uuid.test(assetId))return NextResponse.json({error:"Indica un puesto válido"},{status:400,headers:{"Cache-Control":"private, no-store"}});
 const community=encodeURIComponent(identity.communityId);
 const assetFilter=uuid.test(assetId)?`id=eq.${encodeURIComponent(assetId)}`:`asset_code=eq.${encodeURIComponent(canonicalCode(raw))}`;
 const assetResponse=await operationsDbFetch(`property_assets?select=id,asset_code,parking_level,parking_class,zone_code,status,linked_unit_code&community_id=eq.${community}&asset_type=eq.parking&active=eq.true&${assetFilter}&limit=1`,identity);
 if(!assetResponse.ok)return NextResponse.json({error:"No se pudo consultar el estacionamiento"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const assets=await assetResponse.json() as AssetRow[];
 const asset=assets[0];
 if(!asset)return NextResponse.json({error:"Estacionamiento no encontrado"},{status:404,headers:{"Cache-Control":"private, no-store"}});

 const occupancyResponse=await operationsDbFetch(`property_asset_occupancy?select=id,relationship,party_reference_id,vehicle_reference,valid_from,valid_until,active,created_at,updated_at&community_id=eq.${community}&asset_id=eq.${encodeURIComponent(asset.id)}&order=created_at.desc&limit=50`,identity);
 if(!occupancyResponse.ok)return NextResponse.json({error:"No se pudo consultar el historial"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const occupancy=await occupancyResponse.json() as OccupancyRow[];
 const partyIds=[...new Set(occupancy.map(row=>row.party_reference_id).filter(Boolean))];
 let parties:PartyRow[]=[];
 if(partyIds.length){
  const partyResponse=await operationsDbFetch(`property_parties_private?select=id,display_name,unit_code&community_id=eq.${community}&id=in.(${partyIds.map(id=>encodeURIComponent(id)).join(",")})`,identity);
  if(!partyResponse.ok)return NextResponse.json({error:"No se pudo consultar las personas relacionadas"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  parties=await partyResponse.json() as PartyRow[];
 }
 const partyById=new Map(parties.map(party=>[party.id,party]));
 const history=occupancy.map(row=>{
  const party=partyById.get(row.party_reference_id);
  return {
   id:row.id,relationship:row.relationship,partyId:row.party_reference_id,
   displayName:party?.display_name||"Referencia no disponible",unitCode:party?.unit_code||null,
   vehicleReference:row.vehicle_reference,validFrom:row.valid_from,validUntil:row.valid_until,
   active:row.active,createdAt:row.created_at,updatedAt:row.updated_at,
  };
 });
 return NextResponse.json({
  communityId:identity.communityId,syntheticOnly:true,
  asset:{id:asset.id,code:asset.asset_code,level:asset.parking_level,parkingClass:asset.parking_class,zoneCode:asset.zone_code,status:asset.status,linkedUnitCode:asset.linked_unit_code},
  history,
 },{headers:{"Cache-Control":"private, no-store"}});
}
