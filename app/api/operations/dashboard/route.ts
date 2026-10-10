import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission} from "../../../../lib/server/operations-auth";

type ShiftDbRow={
 id:string;
 service_date:string;
 slot_code:string;
 starts_at:string;
 ends_at:string;
 status:"planned"|"vacant"|"requested"|"confirmed"|"received";
 revision:number;
 assignee_staff_id:string|null;
};

type IncidentDbRow={
 id:string;
 service_date:string;
 area:string;
 priority:"low"|"medium"|"high"|"critical";
 state:"reported"|"acknowledged"|"assigned"|"in_progress"|"resolved"|"closed";
 assigned_role:string|null;
 revision:number;
 created_at:string;
 updated_at:string;
};

type StaffDbRow={
 id:string;
 display_name:string;
 staff_function:string;
};

function validServiceDate(value:string|null):value is string{
 if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+"T00:00:00Z");
 return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}

export async function GET(req:Request){
 const identity=await requireOperationPermission("view_shift_schedule");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 const date=new URL(req.url).searchParams.get("date");
 if(!validServiceDate(date))return NextResponse.json({error:"Fecha inválida"},{status:400,headers:{"Cache-Control":"private, no-store"}});

 const community=encodeURIComponent(identity.communityId);
 const serviceDate=encodeURIComponent(date);
 const shiftPath=`shift_assignments?select=id,service_date,slot_code,starts_at,ends_at,status,revision,assignee_staff_id&community_id=eq.${community}&service_date=eq.${serviceDate}&order=starts_at.asc`;
 const incidentPath=`incidents?select=id,service_date,area,priority,state,assigned_role,revision,created_at,updated_at&community_id=eq.${community}&state=not.in.(resolved,closed)&order=created_at.desc&limit=50`;
 const mayManageShifts=identity.role==="administrator"||identity.role==="mayordomo";
 const staffPath=`staff_private?select=id,display_name,staff_function&community_id=eq.${community}&coverage_eligible=eq.true&active=eq.true&order=display_name.asc`;

 const [shiftResponse,incidentResponse,staffResponse]=await Promise.all([
  operationsDbFetch(shiftPath,identity),
  operationsDbFetch(incidentPath,identity),
  mayManageShifts?operationsDbFetch(staffPath,identity):Promise.resolve(null),
 ]);
 if(!shiftResponse.ok)return NextResponse.json({error:"No se pudo consultar la cobertura"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 if(!incidentResponse.ok)return NextResponse.json({error:"No se pudieron consultar las incidencias"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 if(staffResponse&&!staffResponse.ok)return NextResponse.json({error:"No se pudo consultar el catálogo privado de cobertura"},{status:502,headers:{"Cache-Control":"private, no-store"}});

 const shifts=await shiftResponse.json() as ShiftDbRow[];
 const incidents=await incidentResponse.json() as IncidentDbRow[];
 const staff=staffResponse?await staffResponse.json() as StaffDbRow[]:[];
 const summary={
  shiftTotal:shifts.length,
  vacant:shifts.filter(row=>row.status==="vacant").length,
  requested:shifts.filter(row=>row.status==="requested").length,
  confirmed:shifts.filter(row=>row.status==="confirmed").length,
  received:shifts.filter(row=>row.status==="received").length,
  openIncidents:incidents.length,
  criticalIncidents:incidents.filter(row=>row.priority==="critical").length,
 };

 return NextResponse.json({
  date,
  communityId:identity.communityId,
  role:identity.role,
  summary,
  shifts:shifts.map(row=>({
   id:row.id,
   serviceDate:row.service_date,
   slotCode:row.slot_code,
   startsAt:row.starts_at,
   endsAt:row.ends_at,
   status:row.status,
   revision:row.revision,
   hasAssignee:Boolean(row.assignee_staff_id),
  })),
  incidents:incidents.map(row=>({
   id:row.id,
   serviceDate:row.service_date,
   area:row.area,
   priority:row.priority,
   state:row.state,
   assignedRole:row.assigned_role,
   revision:row.revision,
   createdAt:row.created_at,
   updatedAt:row.updated_at,
  })),
  staff:staff.map(row=>({id:row.id,displayName:row.display_name,staffFunction:row.staff_function})),
 },{headers:{"Cache-Control":"private, no-store"}});
}
