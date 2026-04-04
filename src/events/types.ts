// events.ts
export type CaseEventType =
  | "CASE_CREATED"
  | "CASE_UPDATED"
  | "CASE_ARCHIVED"
  | "CASE_UNARCHIVED"
  | "RESET_PASSWORD"
  | "CLIENT_CREATED"
  | "CLIENT_UPDATED"
  | "CLIENT_DELETED"
  | "CLIENT_ASSIGNED_TO_CASE"
  | "STAGE_ACTIVITY_UPDATED"

export const NOTIFICATION_TYPES = [
  "CASE_CREATED",
  "CASE_UPDATED",
  "CASE_ARCHIVED",
  "CASE_UNARCHIVED",
  "STAGE_ACTIVITY_UPDATED",
  "RESET_PASSWORD",
  "CLIENT_CREATED",
  "CLIENT_UPDATED",
  "CLIENT_DELETED",
  "CLIENT_ASSIGNED_TO_CASE",
]

export interface CaseEvent {
  type: CaseEventType;
  caseId: string;
  actorId: string; // who performed the action
  payload: Record<string, any>; // flexible metadata
  timestamp: string; // ISO string
}
