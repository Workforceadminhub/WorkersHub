export const ADMIN_ENUMS = {
  ADMIN_TEAM: "Gbagada Campus",
  ADMIN_DEPARTMENT: "Church Admin",
};

/** Map variant department names to canonical form for consistent matching and display. */
export const DEPARTMENT_NAME_CANONICAL: Record<string, string> = {
  "Pastoral leaders": "Pastoral Leaders",
  "Pastoral leader": "Pastoral Leaders",
};

/** Return canonical department name; use when aggregating or displaying to avoid case confusion. */
export function normalizeDepartmentName(name: string | null | undefined): string {
  if (name == null || typeof name !== "string") return "";
  const trimmed = name.trim();
  const canonical = DEPARTMENT_NAME_CANONICAL[trimmed];
  if (canonical) return canonical;
  const lower = trimmed.toLowerCase();
  for (const [variant, canon] of Object.entries(DEPARTMENT_NAME_CANONICAL)) {
    if (variant.toLowerCase() === lower) return canon;
  }
  return trimmed;
}

/** Role values stored in admin.role and used in JWT/auth. */
export const ROLES = {
  HOD: "HOD",
  SUB_TEAM_ADMIN: "sub-team-admin",
  ADMIN: "admin",
  SUPER_ADMIN: "super-admin",
  CHURCH_ADMIN: "church-admin",
  WF_ADMIN: "wf-admin", // Dev Mode
  USER: "user",
  /** PRD-aligned aliases (store in admin.role as needed). */
  DIRECTIONAL_LEADER: "directional-leader",
  PASTORAL_LEADER: "pastoral-leader",
  TEAM_HEAD: "team-head",
  DISTRICT_PASTOR: "district-pastor",
  COMMUNITY_LEADER: "community-leader",
  ZONAL_LEADER: "zonal-leader",
  SUB_TEAM_HEAD: "sub-team-head",
  ASSISTANT_HOD: "assistant-hod",
  SMALL_GROUP_LEADER: "small-group-leader",
  CELL_LEADER: "cell-leader",
  WORKER: "worker",
} as const;

export type RoleValue = (typeof ROLES)[keyof typeof ROLES];

/** All role values (for validation). */
export const ROLES_VALUES: readonly string[] = Object.values(ROLES);

/** Routes that allow "user" level access: super-admin, admin, user, HOD, church-admin, sub-team-admin, wf-admin. */
export const ROLES_WITH_USER_ACCESS: RoleValue[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.USER,
  ROLES.HOD,
  ROLES.CHURCH_ADMIN,
  ROLES.SUB_TEAM_ADMIN,
  ROLES.WF_ADMIN,
];

/** Routes that require admin or super-admin (e.g. worker admin, departments CRUD, audit). */
export const ROLES_ADMIN_AND_ABOVE: RoleValue[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HOD,
  ROLES.CHURCH_ADMIN,
  ROLES.SUB_TEAM_ADMIN,
  ROLES.WF_ADMIN,
];

/** Super-admin only (admin user CRUD, assign permissions/role). */
export const ROLES_SUPER_ADMIN_ONLY: RoleValue[] = [ROLES.SUPER_ADMIN];

export const WORKER_STATUS = {
  PENDING_ADD: "PENDING_ADD",
  PENDING_DELETE: "PENDING_DELETE",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};
