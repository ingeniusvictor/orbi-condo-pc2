type Props={name:string,size?:number};

const base={fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};

export default function CertificationIcon({name,size=34}:Props){
 const p={width:size,height:size,viewBox:"0 0 48 48","aria-hidden":true};
 if(name.includes("Plan de Emergencia"))return <svg {...p}><g {...base}><path d="M14 6h15l7 7v29H14z"/><path d="M29 6v8h7M19 22h12M19 28h12M19 34h7"/><path d="m18 15 2 2 4-5"/></g></svg>;
 if(name.includes("Extintores"))return <svg {...p}><g {...base}><path d="M19 16h12v25H17V20a4 4 0 0 1 2-4Z"/><path d="M21 16v-4h8v4M23 12V8h8l4 4M31 9h5l3 4M20 25h8M20 30h8"/><path d="M31 19c5 2 7 5 7 10v5"/></g></svg>;
 if(name.includes("Ascensores"))return <svg {...p}><g {...base}><rect x="11" y="7" width="26" height="34" rx="3"/><path d="M24 7v34M17 16l3-3 3 3M20 13v9M31 32l-3 3-3-3M28 35v-9"/></g></svg>;
 return <svg {...p}><g {...base}><path d="M12 15h24v25H12zM16 10h16v5M18 10V6h12v4"/><path d="M18 28c3 0 3-3 6-3s3 3 6 3 3-3 6-3M24 18c4 5 6 8 6 11a6 6 0 1 1-12 0c0-3 2-6 6-11Z"/></g></svg>;
}
