export type ApartmentTypology={id:"C1"|"C2"|"C3";bedrooms:number;bathrooms:number;interiorBuiltM2:number;loggiaM2:number;internalM2:number;terraceComputedM2:number;totalBuiltM2:number;notes:string};
export const APARTMENT_PLAN_SOURCE={title:"Departamentos tipo C1, C2 y C3 — planta, cuadro de áreas y simbología",sheet:"08a",version:"A",date:"Mayo 2019",scale:"1:50",status:"Plano arquitectónico de referencia; verificar contra planos definitivos y unidades entregadas"};
export const APARTMENT_TYPOLOGIES:ApartmentTypology[]=[
{id:"C1",bedrooms:3,bathrooms:2,interiorBuiltM2:59.91,loggiaM2:1.82,internalM2:61.73,terraceComputedM2:0,totalBuiltM2:61.73,notes:"El cuadro de áreas registra superficie de terraza computable igual a 0 m²."},
{id:"C2",bedrooms:3,bathrooms:2,interiorBuiltM2:55.29,loggiaM2:2.10,internalM2:57.39,terraceComputedM2:1.37,totalBuiltM2:58.76,notes:"La terraza se contabiliza al 50% en el cuadro de áreas."},
{id:"C3",bedrooms:2,bathrooms:2,interiorBuiltM2:55.14,loggiaM2:1.93,internalM2:57.07,terraceComputedM2:0,totalBuiltM2:57.07,notes:"El cuadro de áreas registra superficie de terraza computable igual a 0 m²."}
];
export const APARTMENT_FINISHES=[
"Suelo fotolaminado de 8 mm (P1)",
"Cerámica 46 × 46 cm (P2)",
"Gres cerámico (P3)",
"Baños: esmalte al agua y cerámica blanca 20 × 30 cm",
"Cocinas: esmalte al agua y cerámica blanca 25 × 45 cm",
"Recintos secos: papel mural",
"Cielos de zonas húmedas: pintura esmalte al agua semibrillo",
"Cielos de zonas secas: pintura látex"
];
