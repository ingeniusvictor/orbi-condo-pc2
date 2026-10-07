import type {MaintenanceEvent} from "./maintenance-alerts";
/** Explicitly fictional examples. Never feed these records into a live notification job. */
export const DEMO_EVENTS:MaintenanceEvent[]=[
 {id:"demo-lift",communityId:"demo-pc2",assetId:"lift",assetName:"Ascensores",dueDate:"2030-04-20"},
 {id:"demo-pumps",communityId:"demo-pc2",assetId:"pumps",assetName:"Sala de Bombas",dueDate:"2030-04-27"},
 {id:"demo-cctv",communityId:"demo-pc2",assetId:"cctv",assetName:"CCDD · CCTV",dueDate:"2030-04-13"}
];
export const DEMO_REFERENCE_TIME=new Date("2030-04-20T15:00:00Z");
