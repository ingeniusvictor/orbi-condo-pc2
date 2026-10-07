export type SurveyChoice={id:string;label:string};
export type Survey={id:string;communityId:string;question:string;description:string;choices:SurveyChoice[];opensAt:string;closesAt:string;status:"draft"|"pending_committee"|"approved"|"published"|"closed";createdBy:string;approvedBy?:string;};
export type SurveyResponse={surveyId:string;communityId:string;respondentId:string;choiceId:string;submittedAt:string};
export function validateSurvey(survey:Survey):string[]{
 const errors:string[]=[];
 if(!survey.question.trim())errors.push("La pregunta es obligatoria");
 if(survey.choices.length<2||survey.choices.length>10)errors.push("Debe tener entre 2 y 10 opciones");
 if(survey.choices.some(c=>!c.id||!c.label.trim())||new Set(survey.choices.map(c=>c.id)).size!==survey.choices.length)errors.push("Las opciones deben ser únicas y no vacías");
 if(!Number.isFinite(Date.parse(survey.opensAt))||!Number.isFinite(Date.parse(survey.closesAt))||Date.parse(survey.closesAt)<=Date.parse(survey.opensAt))errors.push("El cierre debe ser posterior a la apertura");
 return errors;
}
export function canPublishSurvey(survey:Survey):boolean{
 return survey.status==="approved"&&Boolean(survey.approvedBy)&&survey.approvedBy!==survey.createdBy&&validateSurvey(survey).length===0;
}
export function canRespond(survey:Survey,now:Date):boolean{
 return survey.status==="published"&&now.getTime()>=Date.parse(survey.opensAt)&&now.getTime()<Date.parse(survey.closesAt);
}
export function tally(survey:Survey,responses:SurveyResponse[]){
 const counts=new Map(survey.choices.map(c=>[c.id,0]));
 const seen=new Set<string>();
 for(const response of responses){
  if(response.surveyId!==survey.id||response.communityId!==survey.communityId||seen.has(response.respondentId)||!counts.has(response.choiceId))continue;
  seen.add(response.respondentId);counts.set(response.choiceId,(counts.get(response.choiceId)??0)+1);
 }
 return survey.choices.map(c=>({...c,votes:counts.get(c.id)??0}));
}
/** Advisory surveys only. Formal coproperty votes require a separately validated process. */
