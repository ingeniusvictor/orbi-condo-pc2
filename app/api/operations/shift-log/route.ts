import {NextResponse} from "next/server";
import {operationsDbFetch,requireOperationPermission} from "../../../../lib/server/operations-auth";
import {isServiceDate} from "../../../../data/shift-log-rules";

type ShiftRow={id:string;slot_code:string;starts_at:string;ends_at:string;status:string;revision:number};
type LogRow={id:string;shift_assignment_id:string;state:"open"|"closed";opened_at:string;closed_at:string|null;closure_code:string|null;access_control_status:string|null;equipment_status:string|null;open_incidents_reviewed:boolean|null;pending_items_count:number|null;revision:number;updated_at:string};
type EntryRow={id:string;shift_log_id:string;entry_code:string;category:string;severity:string;incident_id:string|null;case_reference:string|null;created_at:string};

function inFilter(ids:string[]){return `in.(${ids.map(id=>encodeURIComponent(id)).join(",")})`}

export async function GET(req:Request){
 const identity=await requireOperationPermission("view_shift_log");
 if(!identity)return NextResponse.json({error:"No autorizado"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 const date=new URL(req.url).searchParams.get("date");
 if(!isServiceDate(date))return NextResponse.json({error:"Fecha inválida"},{status:400,headers:{"Cache-Control":"private, no-store"}});

 const community=encodeURIComponent(identity.communityId);
 const shiftsResponse=await operationsDbFetch(`shift_assignments?select=id,slot_code,starts_at,ends_at,status,revision&community_id=eq.${community}&service_date=eq.${encodeURIComponent(date)}&order=starts_at.asc`,identity);
 if(!shiftsResponse.ok)return NextResponse.json({error:"No se pudo consultar la jornada"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const shifts=await shiftsResponse.json() as ShiftRow[];
 if(!shifts.length)return NextResponse.json({date,logs:[]},{headers:{"Cache-Control":"private, no-store"}});

 const shiftIds=shifts.map(row=>row.id);
 const logsResponse=await operationsDbFetch(`shift_logs?select=id,shift_assignment_id,state,opened_at,closed_at,closure_code,access_control_status,equipment_status,open_incidents_reviewed,pending_items_count,revision,updated_at&community_id=eq.${community}&shift_assignment_id=${inFilter(shiftIds)}&order=opened_at.asc`,identity);
 if(!logsResponse.ok)return NextResponse.json({error:"No se pudo consultar la bitácora"},{status:502,headers:{"Cache-Control":"private, no-store"}});
 const logs=await logsResponse.json() as LogRow[];

 let entries:EntryRow[]=[];
 if(logs.length){
  const logIds=logs.map(row=>row.id);
  const entriesResponse=await operationsDbFetch(`shift_log_entries?select=id,shift_log_id,entry_code,category,severity,incident_id,case_reference,created_at&community_id=eq.${community}&shift_log_id=${inFilter(logIds)}&order=created_at.asc`,identity);
  if(!entriesResponse.ok)return NextResponse.json({error:"No se pudieron consultar las entradas de bitácora"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  entries=await entriesResponse.json() as EntryRow[];
 }

 const shiftById=new Map(shifts.map(row=>[row.id,row]));
 return NextResponse.json({
  date,
  logs:logs.map(log=>{
   const shift=shiftById.get(log.shift_assignment_id);
   return {
    id:log.id,
    assignmentId:log.shift_assignment_id,
    state:log.state,
    openedAt:log.opened_at,
    closedAt:log.closed_at,
    closureCode:log.closure_code,
    accessControlStatus:log.access_control_status,
    equipmentStatus:log.equipment_status,
    openIncidentsReviewed:log.open_incidents_reviewed,
    pendingItemsCount:log.pending_items_count,
    revision:log.revision,
    updatedAt:log.updated_at,
    shift:shift?{slotCode:shift.slot_code,startsAt:shift.starts_at,endsAt:shift.ends_at,status:shift.status,revision:shift.revision}:null,
    entries:entries.filter(entry=>entry.shift_log_id===log.id).map(entry=>({
     id:entry.id,
     entryCode:entry.entry_code,
     category:entry.category,
     severity:entry.severity,
     linkedIncidentId:entry.incident_id,
     caseReference:entry.case_reference,
     createdAt:entry.created_at,
    })),
   };
  }),
 },{headers:{"Cache-Control":"private, no-store"}});
}
