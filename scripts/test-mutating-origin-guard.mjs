import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const roots=["app/api/auth","app/api/operations"];
const mutatingMethods=new Set(["POST","PUT","PATCH","DELETE"]);

function routeFiles(root){
 const out=[];
 for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  const full=path.join(root,entry.name);
  if(entry.isDirectory())out.push(...routeFiles(full));
  else if(entry.isFile()&&entry.name==="route.ts")out.push(full);
 }
 return out;
}

function functionBody(source,openBrace){
 let depth=0;
 for(let i=openBrace;i<source.length;i++){
  const ch=source[i];
  if(ch==="{")depth++;
  else if(ch==="}"){
   depth--;
   if(depth===0)return source.slice(openBrace+1,i);
  }
 }
 throw new Error("Unbalanced handler body");
}

let inspected=0;
for(const file of roots.flatMap(routeFiles)){
 const source=fs.readFileSync(file,"utf8");
 const handler=/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(\s*([A-Za-z_$][\w$]*)[^)]*\)\s*\{/g;
 let match;
 while((match=handler.exec(source))){
  const method=match[1];
  const requestName=match[2];
  if(!mutatingMethods.has(method))continue;
  inspected++;
  const openBrace=source.indexOf("{",match.index);
  const body=functionBody(source,openBrace);
  const guardPattern=new RegExp(`if\\s*\\(\\s*!trustedOrigin\\(\\s*${requestName}\\s*\\)\\s*\\)`);
  const guard=body.search(guardPattern);
  assert.notEqual(guard,-1,`${file} ${method} must reject untrusted Origin`);
  const firstAwait=body.search(/\bawait\b/);
  assert.equal(firstAwait===-1||guard<firstAwait,true,`${file} ${method} must check Origin before auth/network awaits`);
 }
}

assert.ok(inspected>0,"origin contract must inspect at least one mutating private API handler");
console.log(`PASS ${inspected} private mutating API handlers validate same-origin before auth/network work`);
console.log("PRIVATE MUTATING ORIGIN GUARD CONTRACT GREEN");
