/**
 * Aggregated roles from a user-provided staff roster (October 2026).
 * The original roster contains personal names; deliberately do not commit them.
 * Employment status, shifts, contract types and current headcount are unverified.
 */
export const workforceRoleSnapshot = {
  label:"Nómina compartida · octubre 2026",
  source:"Listado de trabajadores y cargos proporcionado por la comunidad",
  status:"referencial",
  totalListed:11,
  roles:[
    {name:"Auxiliar de aseo",count:6},
    {name:"Conserje",count:3},
    {name:"Mayordomo",count:1},
    {name:"Asistente administrativo",count:1}
  ]
} as const;
