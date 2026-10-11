import assert from "node:assert/strict";
import {readdir,readFile} from "node:fs/promises";
import {extname,join,relative,sep} from "node:path";

const root=process.cwd();
const sourceRoots=["app","components","data","lib"];
const clientRoots=["app","components"];
const sourceExtensions=new Set([".ts",".tsx",".js",".jsx",".mjs",".cjs"]);
const ignoredDirs=new Set(["node_modules",".next",".git","backups"]);

async function walk(directory){
 const absolute=join(root,directory);
 const entries=await readdir(absolute,{withFileTypes:true}).catch(()=>[]);
 const files=[];
 for(const entry of entries){
  if(ignoredDirs.has(entry.name))continue;
  const child=join(directory,entry.name);
  if(entry.isDirectory())files.push(...await walk(child));
  else files.push(child);
 }
 return files;
}

function unix(path){return path.split(sep).join("/")}
function isClientModule(content){return /^\s*["']use client["'];/m.test(content.slice(0,300))}

const clientForbidden=[
 ["Supabase SDK import",/@supabase\//i],
 ["Supabase client construction",/\bcreateClient\s*\(/],
 ["Supabase environment variable",/\bSUPABASE_(?:URL|ANON_KEY|SERVICE_ROLE(?:_KEY)?)\b/i],
 ["direct Supabase host",/\.supabase\.co\b/i],
 ["direct PostgREST endpoint",/\/rest\/v1\//i],
 ["direct Supabase Auth endpoint",/\/auth\/v1\//i],
 ["service role marker",/\bservice_role\b/i],
 ["server-only package",/["']server-only["']/],
 ["server implementation import",/(?:from|import\s*\()[^\n]*["'][^"']*(?:\/server\/|operations-auth)[^"']*["']/],
];

const sourceForbidden=[
 ["service-role environment variable",/\b(?:SUPABASE_)?SERVICE_ROLE(?:_KEY)?\b/i],
 ["hard-coded database connection string",/\bpostgres(?:ql)?:\/\//i],
 ["private key material",/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
];

const allSourceFiles=[];
for(const base of sourceRoots){
 for(const file of await walk(base))if(sourceExtensions.has(extname(file)))allSourceFiles.push(file);
}

const clientFiles=[];
for(const base of clientRoots){
 for(const file of await walk(base)){
  if(!sourceExtensions.has(extname(file)))continue;
  const content=await readFile(join(root,file),"utf8");
  if(isClientModule(content))clientFiles.push({file:unix(file),content});
 }
}

const violations=[];
for(const {file,content} of clientFiles){
 for(const [label,pattern] of clientForbidden){
  if(pattern.test(content))violations.push(`${file}: ${label}`);
 }
}

for(const file of allSourceFiles){
 const normalized=unix(file);
 const content=await readFile(join(root,file),"utf8");
 for(const [label,pattern] of sourceForbidden){
  if(pattern.test(content))violations.push(`${normalized}: ${label}`);
 }
}

const trackedLikeFiles=await walk(".");
for(const file of trackedLikeFiles){
 const normalized=unix(relative(root,join(root,file))||file);
 const name=normalized.split("/").pop()??"";
 if(/^\.env(?:\.|$)/.test(name)&&name!==".env.example")violations.push(`${normalized}: environment file must not be present in repository working tree`);
}

assert.ok(clientFiles.length>0,"boundary contract found no client modules to inspect");
if(violations.length){
 console.error("PRIVATE BOUNDARY CONTRACT RED");
 for(const violation of violations)console.error(`- ${violation}`);
 process.exit(1);
}

console.log(`PASS inspected ${clientFiles.length} client modules: no direct Supabase/server-only boundary violations`);
console.log(`PASS inspected ${allSourceFiles.length} source modules: no service-role, DB URL or private-key material`);
console.log("PASS repository working tree contains no tracked-style private .env files");
console.log("PRIVATE BOUNDARY CONTRACT GREEN");
