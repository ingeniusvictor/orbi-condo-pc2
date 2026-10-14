export const EXPECTED_ROLE_PERMISSIONS=Object.freeze({
 administrator:Object.freeze([
  "lookup_emergency_contact",
  "lookup_parking",
  "view_shift_schedule",
  "report_shift_gap",
  "request_shift_replacement",
  "manage_shift_schedule",
  "confirm_shift_handoff",
  "view_shift_log",
  "write_shift_log",
  "close_shift_log",
  "view_operational_round",
  "write_operational_round",
  "complete_operational_round",
  "report_incident",
  "manage_incident",
  "manage_resident",
  "manage_parking",
  "review_staff_functions",
  "review_staff_contract",
 ]),
 committee:Object.freeze([
  "view_shift_schedule",
  "review_staff_functions",
 ]),
 concierge:Object.freeze([
  "lookup_emergency_contact",
  "lookup_parking",
  "view_shift_schedule",
  "report_shift_gap",
  "confirm_shift_handoff",
  "view_shift_log",
  "write_shift_log",
  "close_shift_log",
  "view_operational_round",
  "write_operational_round",
  "complete_operational_round",
  "report_incident",
 ]),
 mayordomo:Object.freeze([
  "lookup_emergency_contact",
  "lookup_parking",
  "view_shift_schedule",
  "report_shift_gap",
  "request_shift_replacement",
  "manage_shift_schedule",
  "confirm_shift_handoff",
  "view_shift_log",
  "write_shift_log",
  "close_shift_log",
  "view_operational_round",
  "write_operational_round",
  "complete_operational_round",
  "report_incident",
  "manage_incident",
  "review_staff_functions",
 ]),
 resident:Object.freeze([]),
});

export function expectedPermissionsForRole(role){
 return EXPECTED_ROLE_PERMISSIONS[role]??null;
}

export function assertExactRolePermissions(role,actualPermissions){
 const expected=expectedPermissionsForRole(role);
 if(!expected)throw new Error(`No QA permission contract declared for role ${role}`);
 if(!Array.isArray(actualPermissions))throw new Error(`Session permissions for ${role} are not an array`);
 const uniqueActual=new Set(actualPermissions);
 if(uniqueActual.size!==actualPermissions.length)throw new Error(`Session permissions for ${role} contain duplicates`);
 const expectedSorted=[...expected].sort();
 const actualSorted=[...actualPermissions].sort();
 if(expectedSorted.length!==actualSorted.length||expectedSorted.some((permission,index)=>permission!==actualSorted[index])){
  const expectedSet=new Set(expectedSorted);
  const actualSet=new Set(actualSorted);
  const missing=expectedSorted.filter((permission)=>!actualSet.has(permission));
  const unexpected=actualSorted.filter((permission)=>!expectedSet.has(permission));
  throw new Error(`Permission contract mismatch for ${role}: missing=[${missing.join(",")}] unexpected=[${unexpected.join(",")}]`);
 }
 return expected.length;
}
