import type { AuthContext } from "../middleware/requireAuth";
import { ROLES } from "./enums";

const TRAINING_LEADER_ROLES = new Set<string>([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.CHURCH_ADMIN,
  ROLES.WF_ADMIN,
  ROLES.SUB_TEAM_ADMIN,
  ROLES.DIRECTIONAL_LEADER,
  ROLES.PASTORAL_LEADER,
  ROLES.TEAM_HEAD,
  ROLES.DISTRICT_PASTOR,
  ROLES.COMMUNITY_LEADER,
  ROLES.ZONAL_LEADER,
  ROLES.SUB_TEAM_HEAD,
]);

const TRAINING_DASHBOARD_VIEW = new Set<string>([
  ...Array.from(TRAINING_LEADER_ROLES),
  ROLES.HOD,
  ROLES.ASSISTANT_HOD,
  ROLES.SMALL_GROUP_LEADER,
  ROLES.CELL_LEADER,
]);

/** Only Super Admin may create trainings / curriculum (PRD). */
export function canCreateTrainingAndCurriculum(auth: AuthContext): boolean {
  return auth.role === ROLES.SUPER_ADMIN;
}

/** Leaders may nominate except HOD tier and below (PRD). */
export function canNominateWorkers(auth: AuthContext): boolean {
  return TRAINING_LEADER_ROLES.has(auth.role);
}

/** Session attendance, stream metadata, recordings, department assignment. */
export function canManageTrainingOperations(auth: AuthContext): boolean {
  return TRAINING_LEADER_ROLES.has(auth.role);
}

export function canViewTrainingDashboard(auth: AuthContext): boolean {
  return TRAINING_DASHBOARD_VIEW.has(auth.role);
}
