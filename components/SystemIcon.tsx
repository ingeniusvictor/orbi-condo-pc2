type Props={name:string,size?:number};

const base={fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};

export default function SystemIcon({name,size=46}:Props){
 const p={width:size,height:size,viewBox:"0 0 48 48","aria-hidden":true};
 if(name.includes("Ascensores"))return <svg {...p}><g {...base}><rect x="11" y="7" width="26" height="34" rx="3"/><path d="M24 7v34M17 16l3-3 3 3M20 13v9M31 32l-3 3-3-3M28 35v-9"/></g></svg>;
 if(name.includes("Bombas"))return <svg {...p}><g {...base}><path d="M24 5c8 10 13 16 13 24a13 13 0 1 1-26 0c0-8 5-14 13-24Z"/><circle cx="24" cy="29" r="5"/><path d="M24 24v10M19 29h10"/></g></svg>;
 if(name.includes("Electrógeno"))return <svg {...p}><g {...base}><rect x="7" y="12" width="34" height="25" rx="4"/><path d="M26 16l-7 11h6l-3 7 9-12h-6l1-6ZM12 18h4M12 31h4"/></g></svg>;
 if(name.includes("Jardín"))return <svg {...p}><g {...base}><path d="M37 10C22 10 12 18 12 30c11 1 20-3 25-20Z"/><path d="M11 38c4-10 12-17 24-24M20 25c2 2 4 4 6 7"/></g></svg>;
 if(name.includes("Plagas"))return <svg {...p}><g {...base}><path d="M24 6l15 6v10c0 10-6 16-15 20C15 38 9 32 9 22V12l15-6Z"/><path d="M18 25h12M20 20l8 10M28 20l-8 10"/></g></svg>;
 if(name.includes("Piscina"))return <svg {...p}><g {...base}><path d="M8 18c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3M8 26c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3M8 34c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3"/></g></svg>;
 if(name.includes("CCTV"))return <svg {...p}><g {...base}><path d="M8 14h27l5 10H13L8 14Z"/><circle cx="28" cy="19" r="3"/><path d="M18 24l-3 10M15 34H9M35 24l4 7"/></g></svg>;
 if(name.includes("Presurización"))return <svg {...p}><g {...base}><circle cx="24" cy="24" r="4"/><path d="M24 20c1-9 6-12 10-10 4 2 2 8-6 13M28 25c8 4 9 10 5 13-4 3-9-1-9-10M22 28c-7 5-13 2-13-3 0-5 6-7 12-2"/><circle cx="24" cy="24" r="16"/></g></svg>;
 return <svg {...p}><g {...base}><path d="M27 5c2 8-5 11-2 17 2 3 5 4 6 1 5 4 7 9 5 14-2 5-7 8-12 8-8 0-14-5-14-13 0-6 4-10 9-15 0 6 3 8 5 7 3-2 1-8 3-19Z"/><path d="M24 27c4 4 5 7 3 10-1 2-5 3-7 0-2-3 0-6 4-10Z"/></g></svg>;
}
