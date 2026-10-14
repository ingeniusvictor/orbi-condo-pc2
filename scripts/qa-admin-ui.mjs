import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rawBaseUrl=(process.env.ORBI_QA_BASE_URL||"").trim();
const email=process.env.ORBI_QA_EMAIL||"";
const password=process.env.ORBI_QA_PASSWORD||"";
const vercelBypass=(process.env.ORBI_QA_VERCEL_BYPASS||"").trim();
const artifactDir=path.resolve(process.env.ORBI_QA_ARTIFACT_DIR||"artifacts/admin-ui");
const viewports=[
 {width:390,height:844,label:"390x844"},
 {width:430,height:932,label:"430x932"},
 {width:768,height:1024,label:"768x1024"},
 {width:1440,height:900,label:"1440x900"},
 {width:1920,height:1080,label:"1920x1080"},
];

function failSetup(message){console.error(message);process.exit(2)}
function assert(condition,message){if(!condition)throw new Error(message)}

if(!rawBaseUrl)failSetup("Missing ORBI_QA_BASE_URL.");
if(!email||!password)failSetup("Missing ORBI_QA_EMAIL / ORBI_QA_PASSWORD.");
if(!vercelBypass)failSetup("Missing ORBI_QA_VERCEL_BYPASS.");

let baseUrl;
try{baseUrl=new URL(rawBaseUrl)}catch{failSetup("ORBI_QA_BASE_URL must be an absolute URL.")}
if(baseUrl.protocol!=="https:"||baseUrl.username||baseUrl.password||baseUrl.hash||baseUrl.search||baseUrl.pathname!=="/")failSetup("ORBI_QA_BASE_URL must be a credential-free HTTPS origin.");
if(baseUrl.hostname==="orbi-condo-pc2.vercel.app")failSetup("Production hostname is forbidden for synthetic UI QA.");
if(!/^orbi-condo-pc2-[a-z0-9-]+-orbi4\.vercel\.app$/.test(baseUrl.hostname))failSetup("Target is not an ORBI LIVING orbi4 Preview hostname.");

function focusIsVisible(style){
 const outlineWidth=Number.parseFloat(style.outlineWidth||"0");
 return (style.outlineStyle!=="none"&&outlineWidth>=2)||(style.boxShadow&&style.boxShadow!=="none");
}

async function findEmailByKeyboard(page){
 for(let attempt=0;attempt<12;attempt+=1){
  await page.keyboard.press("Tab");
  const state=await page.evaluate(()=>{
   const active=document.activeElement;
   if(!(active instanceof HTMLElement))return null;
   const style=getComputedStyle(active);
   return {
    tag:active.tagName.toLowerCase(),
    type:active instanceof HTMLInputElement?active.type:null,
    name:active.getAttribute("name"),
    outlineStyle:style.outlineStyle,
    outlineWidth:style.outlineWidth,
    boxShadow:style.boxShadow,
   };
  });
  if(state?.tag==="input"&&state.type==="email")return state;
 }
 throw new Error("Email input was not reachable by keyboard within 12 Tab stops.");
}

async function inspectViewport(page,viewport){
 await page.setViewportSize({width:viewport.width,height:viewport.height});
 await page.waitForTimeout(120);
 const result=await page.evaluate(({width,height})=>{
  const root=document.documentElement;
  const main=document.querySelector("main");
  if(!main)throw new Error("Missing main landmark");
  const visible=(element)=>{
   const style=getComputedStyle(element);
   const rect=element.getBoundingClientRect();
   return style.display!=="none"&&style.visibility!=="hidden"&&rect.width>0&&rect.height>0;
  };
  const rects=[...main.querySelectorAll("button,input,select")]
   .filter(visible)
   .map((element)=>{
    const rect=element.getBoundingClientRect();
    return {tag:element.tagName.toLowerCase(),text:(element.textContent||"").trim().slice(0,80),left:rect.left,right:rect.right,width:rect.width,height:rect.height};
   });
  const outside=rects.filter(item=>item.left<-1||item.right>width+1);
  const shortButtons=width<=430?rects.filter(item=>item.tag==="button"&&item.height<43.5):[];
  const heading=main.querySelector("h1");
  const headingRect=heading?.getBoundingClientRect();
  return {
   viewport:{width,height},
   rootScrollWidth:root.scrollWidth,
   bodyScrollWidth:document.body.scrollWidth,
   mainScrollWidth:main.scrollWidth,
   outside,
   shortButtons,
   headingVisible:Boolean(heading&&visible(heading)),
   headingOutside:Boolean(headingRect&&(headingRect.left<-1||headingRect.right>width+1)),
  };
 },viewport);
 assert(result.rootScrollWidth<=viewport.width+1,`${viewport.label}: document horizontal overflow ${result.rootScrollWidth}px > ${viewport.width}px`);
 assert(result.bodyScrollWidth<=viewport.width+1,`${viewport.label}: body horizontal overflow ${result.bodyScrollWidth}px > ${viewport.width}px`);
 assert(result.outside.length===0,`${viewport.label}: ${result.outside.length} private controls overflow the viewport`);
 assert(result.shortButtons.length===0,`${viewport.label}: ${result.shortButtons.length} visible buttons are below 44px touch height`);
 assert(result.headingVisible&&!result.headingOutside,`${viewport.label}: main heading is clipped or missing`);
 await page.screenshot({path:path.join(artifactDir,`${viewport.label}.png`),fullPage:true});
 console.log(`PASS ${viewport.label} · no horizontal overflow · controls contained · screenshot captured`);
 return result;
}

async function inspectAccessibleControls(page){
 const findings=await page.evaluate(()=>{
  const main=document.querySelector("main");
  if(!main)return ["missing main"];
  const visible=(element)=>{
   const style=getComputedStyle(element);
   const rect=element.getBoundingClientRect();
   return style.display!=="none"&&style.visibility!=="hidden"&&rect.width>0&&rect.height>0;
  };
  const labelText=(element)=>{
   const aria=(element.getAttribute("aria-label")||"").trim();
   if(aria)return aria;
   const labelledBy=element.getAttribute("aria-labelledby");
   if(labelledBy){
    const text=labelledBy.split(/\s+/).map(id=>document.getElementById(id)?.textContent||"").join(" ").trim();
    if(text)return text;
   }
   if(element.id){
    const explicit=document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if(explicit?.textContent?.trim())return explicit.textContent.trim();
   }
   const wrapping=element.closest("label");
   if(wrapping?.textContent?.trim())return wrapping.textContent.trim();
   if(element instanceof HTMLButtonElement||element instanceof HTMLAnchorElement)return (element.textContent||"").trim();
   return "";
  };
  return [...main.querySelectorAll("a,button,input,select")]
   .filter(visible)
   .filter(element=>!labelText(element))
   .map(element=>`${element.tagName.toLowerCase()}${element.getAttribute("type")?`[type=${element.getAttribute("type")}]`:""}`);
 });
 assert(findings.length===0,`Accessible-name audit found unnamed visible controls: ${findings.join(", ")}`);
 console.log("PASS core accessibility names · all visible main controls have a semantic label");
 return findings;
}

async function main(){
 await mkdir(artifactDir,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const report={baseUrl:baseUrl.origin,viewports:[],accessibility:{unnamedControls:[]},keyboard:{emailReachable:false,emailFocusVisible:false,passwordFocusVisible:false,submitFocusVisible:false},result:"RED"};
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},extraHTTPHeaders:{"x-vercel-protection-bypass":vercelBypass,"x-vercel-set-bypass-cookie":"true"}});
  const page=await context.newPage();
  await page.goto(`${baseUrl.origin}/operaciones`,{waitUntil:"domcontentloaded",timeout:30000});
  await page.getByRole("heading",{name:/Consola privada/}).waitFor({state:"visible",timeout:20000});
  console.log("PASS protected Preview opened at /operaciones");

  const emailFocus=await findEmailByKeyboard(page);
  report.keyboard.emailReachable=true;
  report.keyboard.emailFocusVisible=focusIsVisible(emailFocus);
  assert(report.keyboard.emailFocusVisible,"Email input is keyboard reachable but lacks a visible focus indicator");
  await page.keyboard.type(email);

  await page.keyboard.press("Tab");
  const passwordFocus=await page.evaluate(()=>{const active=document.activeElement;const style=active instanceof HTMLElement?getComputedStyle(active):null;return active instanceof HTMLInputElement&&active.type==="password"&&style?{outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,boxShadow:style.boxShadow}:null;});
  assert(passwordFocus,"Password input did not follow email in keyboard order");
  report.keyboard.passwordFocusVisible=focusIsVisible(passwordFocus);
  assert(report.keyboard.passwordFocusVisible,"Password input lacks a visible focus indicator");
  await page.keyboard.type(password);

  await page.keyboard.press("Tab");
  const submitFocus=await page.evaluate(()=>{const active=document.activeElement;const style=active instanceof HTMLElement?getComputedStyle(active):null;return active instanceof HTMLButtonElement&&style?{text:(active.textContent||"").trim(),outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,boxShadow:style.boxShadow}:null;});
  assert(submitFocus?.text.includes("Ingresar"),"Login submit button did not follow password in keyboard order");
  report.keyboard.submitFocusVisible=focusIsVisible(submitFocus);
  assert(report.keyboard.submitFocusVisible,"Login submit button lacks a visible focus indicator");
  await page.keyboard.press("Enter");

  await page.getByRole("heading",{name:/Operación en vivo/}).waitFor({state:"visible",timeout:20000});
  await page.getByText(/Administración · pc2/).waitFor({state:"visible",timeout:10000});
  console.log("PASS keyboard login · Administrator workspace visible");

  report.accessibility.unnamedControls=await inspectAccessibleControls(page);
  for(const viewport of viewports)report.viewports.push(await inspectViewport(page,viewport));

  const logout=page.getByRole("button",{name:"Salir"});
  await logout.click();
  await page.getByRole("heading",{name:/Consola privada/}).waitFor({state:"visible",timeout:10000});
  console.log("PASS logout returned UI to private login boundary");
  report.result="GREEN";
  await context.close();
 }finally{
  await writeFile(path.join(artifactDir,"report.json"),JSON.stringify(report,null,2));
  await browser.close();
 }
 console.log("ADMIN UI QA GREEN");
}

main().catch(async error=>{
 console.error(error?.stack||error);
 process.exitCode=1;
});
