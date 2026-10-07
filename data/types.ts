export type MaintenanceStatus="scheduled"|"ondemand";
export type MaintenanceFrequency="Mensual"|"Bimensual"|"Trimestral"|"Por requerimiento";

export type MaintenanceSystem={
 name:string;
 frequency:MaintenanceFrequency;
 provider:string;
 status:MaintenanceStatus;
 note:string;
};

export type Provider={
 name:string;
 service:string;
 verified:boolean;
 detail:string;
 web?:string;
};

export type Certification={
 icon:string;
 name:string;
 frequency:"Anual";
 state:string;
};

export type Community={
 slug:string;
 name:string;
 city:string;
 region:string;
 tagline:string;
 housingCount:number;
 housingProgram:string;
 publicProjectCode:string;
 systems:MaintenanceSystem[];
 providers:Provider[];
 certifications:Certification[];
 amenities:string[];
};
