/** Aggregate figures transcribed from the August 2026 Comunidad Feliz liquidation.
 * Do not commit resident names, unit IDs, payment codes, account numbers or individual wages.
 */
export const august2026Finance = {
 period:"Agosto 2026",
 total:16923652,
 source:"Comunidad Feliz · Liquidación de gastos comunes · página 2",
 categories:[
  {name:"Administración",amount:9067360},
  {name:"Agua",amount:200180},
  {name:"Artículos de librería",amount:114240},
  {name:"Electricidad",amount:2104300},
  {name:"Plataforma Comunidad Feliz",amount:62087},
  {name:"Gastos legales",amount:50000},
  {name:"Insumos operativos",amount:442078},
  {name:"Mantención",amount:1483067},
  {name:"Otros",amount:1356148},
  {name:"Proyecto cámaras",amount:693913},
  {name:"Reparación",amount:290015},
  {name:"Seguros generales",amount:1060264}
 ],
 externalAdministrationFee:1127594,
 laborLiquidations:6403208,
 laborPension:1536558,
 reserveFundCollected:845870,
 reserveFundReportedBalance:17536869
} as const;
