import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission} from "../../../../lib/server/operations-auth";

type AssetRow={
 id:string;
 asset_code:string;
 parking_level:"exterior"|"subterranean";
 parking_class:"resident"|"visit"|"commercial";
 zone_code:string|null;
 status:"available"|"assigned"|"leased"|"loaned"|"review";
 linked_unit_code:string|null;
 sort_order:number;
 revision:number;
};
type OccupancyRow={
 id:string;
 asset_id:string;
 relationship:"owner"|"tenant"|"authorized_user"|"loaned";
 party_reference_id:string;
 vehicle_reference:string|null;
 valid_from:string;
 valid_until:string|null;
 revision:number;
};
type PartyRow={id:string;display_name:string;unit_code:string|null;revision:number};

type PartyDetail={id:string;displayName:string;unitCode:string|null};

type ParkingDetail={
 id:string;
 code:string;
 level:AssetRow["parking_level"];
 parkingClass:AssetRow["parking_class"];
 zoneCode:string|null;
 status:AssetRow["status"];
 linkedUnitCode:string|null;
 sortOrder:number;
 revision:number;
 owner:PartyDetail|null;
 tenant:PartyDetail|null;
 vehicleReference:string|null;
};

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
 const identity=await requireOperationPermission("lookup_parking");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 const query=(new URL(req.url).searchParams.get("q")||"").trim().slice(0,80);
 const community=encodeURIComponent(identity.communityId);
 const [assetResponse,occupancyResponse,partyResponse]=await Promise.all([
  operationsDbFetch(`property_assets?select=id,asset_code,parking_level,parking_class,zone_code,status,linked_unit_code,sort_order,revision&community_id=eq.${community}&asset_type=eq.parking&active=eq.true&order=sort_order.asc`,identity),
  operationsDbFetch(`property_asset_occupancy?select=id,asset_id,relationship,party_reference_id,vehicle_reference,valid_from,valid_until,revision&community_id=eq.${community}&active=eq.true&order=created_at.desc`,identity),
  operationsDbFetch(`property_parties_private?select=id,display_name,unit_code,revision&community_id=eq.${community}&active=eq.true&order=display_name.asc`,identity),
 ]);
 if(!assetResponse.ok)return NextResponse.json({error:"No se pudo consultar el inventario de estacionamientos"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 if(!occupancyResponse.ok||!partyResponse.ok)return NextResponse.json({error:"No se pudo consultar la relación privada de estacionamientos"},{status:502,headers:{"Cache-Control":"private, no-store"}});

 const assets=await assetResponse.json() as AssetRow[];
 const occupancy=await occupancyResponse.json() as OccupancyRow[];
 const parties=await partyResponse.json() as PartyRow[];
 const partyById=new Map(parties.map(party=>[party.id,party]));
 const relationByAsset=new Map<string,OccupancyRow[]>();
 for(const relation of occupancy){const list=relationByAsset.get(relation.asset_id)||[];list.push(relation);relationByAsset.set(relation.asset_id,list);}

 const details:ParkingDetail[]=assets.map(asset=>{
  const relations=relationByAsset.get(asset.id)||[];
  const ownerRelation=relations.find(row=>row.relationship==="owner")||null;
  const tenantRelation=relations.find(row=>row.relationship==="tenant")||null;
  const ownerRow=ownerRelation?partyById.get(ownerRelation.party_reference_id):undefined;
  const tenantRow=tenantRelation?partyById.get(tenantRelation.party_reference_id):undefined;
  const partyDetail=(party:PartyRow|undefined):PartyDetail|null=>party?{id:party.id,displayName:party.display_name,unitCode:party.unit_code}:null;
  return {
   id:asset.id,code:asset.asset_code,level:asset.parking_level,parkingClass:asset.parking_class,zoneCode:asset.zone_code,
   status:asset.status,linkedUnitCode:asset.linked_unit_code,sortOrder:asset.sort_order,revision:asset.revision,
   owner:partyDetail(ownerRow),tenant:partyDetail(tenantRow),vehicleReference:tenantRelation?.vehicle_reference||ownerRelation?.vehicle_reference||null,
  };
 });

 const basic=details.map(item=>({
  id:item.id,code:item.code,level:item.level,parkingClass:item.parkingClass,zoneCode:item.zoneCode,status:item.status,
  sortOrder:item.sortOrder,revision:item.revision,hasOwner:Boolean(item.owner),hasTenant:Boolean(item.tenant),
 }));
 const normalized=query.toLocaleLowerCase("es-CL");
 const exactCode=canonicalCode(query);
 const matches=query?details.filter(item=>{
  const haystack=[item.code,item.linkedUnitCode,item.owner?.displayName,item.owner?.unitCode,item.tenant?.displayName,item.tenant?.unitCode,item.vehicleReference].filter(Boolean).join(" ").toLocaleLowerCase("es-CL");
  return item.code.toUpperCase()===exactCode||haystack.includes(normalized);
 }).sort((a,b)=>Number(b.code.toUpperCase()===exactCode)-Number(a.code.toUpperCase()===exactCode)||a.sortOrder-b.sortOrder).slice(0,30):[];

 const summary={
  total:assets.length,
  exterior:assets.filter(row=>row.parking_level==="exterior").length,
  subterranean:assets.filter(row=>row.parking_level==="subterranean").length,
  resident:assets.filter(row=>row.parking_class==="resident").length,
  visit:assets.filter(row=>row.parking_class==="visit").length,
  commercial:assets.filter(row=>row.parking_class==="commercial").length,
  leased:assets.filter(row=>row.status==="leased").length,
  assigned:assets.filter(row=>row.status==="assigned").length,
  review:assets.filter(row=>row.status==="review").length,
 };

 return NextResponse.json({communityId:identity.communityId,role:identity.role,syntheticOnly:true,summary,assets:basic,matches},{headers:{"Cache-Control":"private, no-store"}});
}
