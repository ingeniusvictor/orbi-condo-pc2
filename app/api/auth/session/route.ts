import {NextResponse} from "next/server";
import {authenticateOperations,operationsBackendConfigured,permissionsForIdentity} from "../../../../lib/server/operations-auth";

export async function GET(){
 const identity=await authenticateOperations();
 return NextResponse.json({
  configured:operationsBackendConfigured,
  authenticated:Boolean(identity),
  communityId:identity?.communityId??null,
  role:identity?.role??null,
  permissions:identity?permissionsForIdentity(identity):[]
 },{headers:{"Cache-Control":"private, no-store"}});
}
