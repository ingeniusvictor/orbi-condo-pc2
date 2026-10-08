import type {EvidenceStatus} from "./evidence";
export type PublishedEvidence={id:string;systemName:string;workOrderId:string;title:string;performedAt:string;provider:string;summary:string;status:EvidenceStatus;publishedAt:string;attachments:{name:string;url:string}[]};
export function visibleEvidenceForSystem(records:PublishedEvidence[],systemName:string):PublishedEvidence[]{
 return records.filter(r=>r.systemName===systemName&&r.status==="accepted"&&Boolean(r.publishedAt)).sort((a,b)=>b.performedAt.localeCompare(a.performedAt));
}
export const PUBLISHED_EVIDENCE_DEMO:PublishedEvidence[]=[];
