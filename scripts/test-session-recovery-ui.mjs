import assert from "node:assert/strict";
import fs from "node:fs";
import {decideSessionRecovery,isOperationsSessionProbe} from "../lib/client-session-recovery.ts";

const authenticated={configured:true,authenticated:true,communityId:"pc2",role:"administrator",permissions:["view_shift_schedule"]};
const anonymous={configured:true,authenticated:false,communityId:null,role:null,permissions:[]};
const unconfigured={configured:false,authenticated:false,communityId:null,role:null,permissions:[]};

assert.equal(isOperationsSessionProbe(authenticated),true);
assert.equal(isOperationsSessionProbe({configured:true,authenticated:false,communityId:null,role:null,permissions:[123]}),false);
assert.equal(isOperationsSessionProbe({configured:true,authenticated:false}),false);
assert.equal(decideSessionRecovery(authenticated).kind,"ready");
assert.equal(decideSessionRecovery(unconfigured).kind,"backend-unconfigured");
assert.equal(decideSessionRecovery(anonymous).kind,"refresh");
assert.equal(decideSessionRecovery(anonymous,200).kind,"ready");
assert.equal(decideSessionRecovery(anonymous,401).kind,"login");
for(const status of [400,403,408,409,422,429,500,502,503,504]){
 assert.equal(decideSessionRecovery(anonymous,status).kind,"transient",`refresh status ${status} must fail closed as transient rather than impersonating logout`);
}
console.log("PASS session recovery decision model separates definitive 401 from transient/unknown refresh failures");

const gate=fs.readFileSync("app/operaciones/session-recovery-gate.tsx","utf8");
const layout=fs.readFileSync("app/operaciones/layout.tsx","utf8");
assert.match(gate,/if\(gate===\"ready\"\)return children;/,"private children must mount only after a resolved ready/login/backend state");
assert.match(gate,/if\(!sessionResponse\.ok\)\{setGate\(\"transient\"\);return;\}/,"session endpoint failures must hide private children");
assert.match(gate,/if\(!isOperationsSessionProbe\(payload\)\)\{setGate\(\"transient\"\);return;\}/,"malformed session payloads must fail closed");
assert.match(gate,/afterRefresh\.kind===\"ready\"\|\|afterRefresh\.kind===\"login\"\?\"ready\":\"transient\"/,"only successful refresh or definitive invalid session may leave the recovery gate");
assert.match(gate,/Reintentar validación/,"transient state must expose an explicit manual retry");
assert.doesNotMatch(gate,/setInterval|setTimeout/,"recovery UI must not create an automatic retry loop");
assert.doesNotMatch(gate,/localStorage|sessionStorage|document\.cookie/,"recovery UI must not persist or inspect private credentials client-side");
assert.match(layout,/SessionRecoveryGate/);
assert.match(layout,/PrivateApiFailureReference/,"existing safe API failure reference surface must remain mounted");
console.log("PASS transient recovery UI hides operations, avoids false logout and retries only on explicit user action");
console.log("ADMINISTRATOR TRANSIENT SESSION RECOVERY UI CONTRACT GREEN");
