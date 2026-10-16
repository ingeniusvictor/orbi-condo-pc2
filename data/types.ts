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

export type ReceptionTypology={
 code:string;
 units:number;
 areaM2:number;
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
 receptionRecord:{
  certificateNumber:string;
  certificateDate:string;
  approvalDate:string;
  legalReference:string;
  sourceLabel:string;
 };
 propertyInventory:{
  apartments:number;
  commercialUnits:number;
  storageUnits:number;
  parkingSpaces:number;
 };
 receptionTypologies:ReceptionTypology[];
 systems:MaintenanceSystem[];
 providers:Provider[];
 certifications:Certification[];
 amenities:string[];
};
