import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root="app/api/operations";
const methods=new Set(["GET","POST","PUT","PATCH","DELETE"]);

function routeFiles(dir){
 const out=[];
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())out.push(...routeFiles(full));
  else if(entry.isFile()&&entry.name==="route.ts")out.push(full);
 }
 return out;
}

function functionBody(source,openBrace){
 let depth=0;
 for(let i=openBrace;i<source.length;i++){
  if(source[i]==="{")depth++;
  else if(source[i]==="}"){
   depth--;
   if(depth===0)return source.slice(openBrace+1,i);
  }
 }
 throw new Error("Unbalanced operations route handler body");
}

let inspected=0;
for(const file of routeFiles(root)){
 const source=fs.readFileSync(file,"utf8");
 const handler=/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*\{/g;
 let match;
 while((match=handler.exec(source))){
  if(!methods.has(match[1]))continue;
  inspected++;
  const openBrace=source.indexOf("{",match.index);
  const body=functionBody(source,openBrace);
  const permission=/const\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+requireOperationPermission\(\s*"([a-z_]+)"\s*\)/.exec(body);
  assert.ok(permission,`${file} ${match[1]} must resolve an explicit operation permission`);
  const identityName=permission[1];
  const permissionIndex=permission.index;
  const denialPattern=new RegExp(`if\\s*\\(\\s*!${identityName}\\b`);
  const denialIndex=body.search(denialPattern);
  assert.notEqual(denialIndex,-1,`${file} ${match[1]} must fail closed when authorization is absent`);
  const dbIndex=body.search(/\boperationsDbFetch\s*\(/);
  if(dbIndex!==-1){
   assert.equal(permissionIndex<dbIndex,true,`${file} ${match[1]} must authorize before operationsDbFetch`);
   assert.equal(denialIndex<dbIndex,true,`${file} ${match[1]} must reject unauthorized identity before data access`);
  }
 }
}

assert.ok(inspected>0,"authorization contract must inspect at least one operations handler");
console.log(`PASS ${inspected} private operations handlers authorize and fail closed before data access`);
console.log("PRIVATE OPERATIONS AUTHORIZATION CONTRACT GREEN");
