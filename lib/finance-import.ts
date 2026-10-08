import type {LedgerEntry} from "./finance-ledger";
/** Browser-only staging model. Do not upload private source PDFs or payroll records. */
export type ImportCandidate = Pick<LedgerEntry,"description"|"supplierDisplayName"|"amountClp"|"paymentDate"|"documentNumber"|"category"|"sourcePage">;
export type ImportIssue = {row:number;reason:string};
export type ImportPreview = {period:string;statedTotalClp:number;rows:ImportCandidate[];issues:ImportIssue[];computedTotalClp:number;differenceClp:number;balanced:boolean};
const categories=new Set(["staff","administration","utilities","maintenance","repairs","supplies","projects","legal","other"]);
const dateValid=(value:string|null)=>value===null||(/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+"T00:00:00Z"))&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value);
export function parseFinanceCsv(csv:string,period:string,statedTotalClp:number):ImportPreview{
 const issues:ImportIssue[]=[];const rows:ImportCandidate[]=[];
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))issues.push({row:0,reason:"Período inválido (AAAA-MM)"});
 if(!Number.isSafeInteger(statedTotalClp)||statedTotalClp<0)issues.push({row:0,reason:"Total declarado inválido"});
 const lines=csv.replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim());
 const expected="descripcion;proveedor;monto_clp;fecha_pago;numero_documento;categoria;pagina";
 if(lines[0]?.trim().toLowerCase()!==expected)issues.push({row:1,reason:"Encabezado CSV incorrecto"});
 for(let i=1;i<lines.length;i++){
  const cells=lines[i].split(";").map(s=>s.trim());const line=i+1;
  if(cells.length!==7){issues.push({row:line,reason:"Se requieren 7 columnas separadas por punto y coma"});continue}
  const [description,supplierDisplayName,rawAmount,rawDate,rawDoc,rawCategory,rawPage]=cells;
  const amountClp=Number(rawAmount),sourcePage=Number(rawPage);
  if(!description||!supplierDisplayName||!Number.isSafeInteger(amountClp)||!categories.has(rawCategory)||!Number.isSafeInteger(sourcePage)||sourcePage<1||!dateValid(rawDate||null)){
   issues.push({row:line,reason:"Descripción, proveedor, monto entero, fecha, categoría o página inválidos"});continue;
  }
  if(rawCategory==="staff"){issues.push({row:line,reason:"Registros individuales de personal prohibidos en importación pública"});continue}
  rows.push({description,supplierDisplayName,amountClp,paymentDate:rawDate||null,documentNumber:rawDoc||null,category:rawCategory as ImportCandidate["category"],sourcePage});
 }
 if(rows.length===0)issues.push({row:0,reason:"No hay movimientos válidos"});
 const computedTotalClp=rows.reduce((n,r)=>n+r.amountClp,0);
 return {period,statedTotalClp,rows,issues,computedTotalClp,differenceClp:computedTotalClp-statedTotalClp,balanced:issues.length===0&&computedTotalClp===statedTotalClp};
}
export const financeCsvTemplate="descripcion;proveedor;monto_clp;fecha_pago;numero_documento;categoria;pagina\nMantención ascensores;Proveedor ejemplo;100000;2026-09-30;F-001;maintenance;2\nDevolución;Proveedor ejemplo;-20000;2026-10-01;;maintenance;2";
