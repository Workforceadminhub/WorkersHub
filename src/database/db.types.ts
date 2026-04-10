/**
 * Kysely types for Harvesters Hub. Primary keys are varchar(26) ULIDs (server: getUlid / getUniqueId).
 */

import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

/* ---------------------------------- WORKER ---------------------------------- */

export interface Worker {
  id: string;
  identifier: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  maritalstatus: string | null;
  othername: string | null;
  phonenumber: string | null;
  fullname: string | null;
  department: string | null;
  team: string | null;
  workerrole: string | null;
  fullnamereverse: string | null;
  ispresent: boolean | null;
  isactive: boolean | null;
  createdat: Generated<Timestamp | null>;
  updatedat: Timestamp | null;
  approvedat: Timestamp | null;
  birthdate: string | null;
  agerange: string | null;
  gender: string | null;
  address: string | null;
  employment: string | null;
  occupation: string | null;
  status: string | null;
  reasonfordelete: string | null;
  nameofrequester: string | null;
  roleofrequester: string | null;
}

/* ----------------------------------- ADMIN ---------------------------------- */

export interface Admin {
  id: string;
  code: string | null;
  email: string | null;
  /** bcrypt hash; null until password is set (legacy or invite-only rows). */
  password_hash: string | null;
  reset_password_token: string | null;
  reset_password_expires: Timestamp | null;
  email_verified_at: Timestamp | null;
  email_verification_token: string | null;
  email_verification_expires: Timestamp | null;
  userinfo: string | null;
  workerid: string | null;
  createdat: Generated<Timestamp | null>;
  updatedat: Timestamp | null;
  route: string | null;
  department: string | null;
  team: string | null;
  isactive: boolean | null;
  permissions: JsonArray | null;
  assigned_by: string | null;
  assigned_date: Timestamp | null;
  role: string | null;
  permission_level: JsonArray | null;
}

/* ----------------------------------- Attendance ---------------------------------- */

export interface Attendance {
  id: string;
  workerid: string | null;
  name: string;
  attendance: string;
  attendancedate: string;
  department: string | null;
  team: string | null;
}

export interface UniqueDate {
  id: string;
  attendancedate: string;
}

export interface ExpiryTable {
  id: string;
  isClosed: boolean | null;
}

/* ----------------------------------- Audit log ---------------------------------- */

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_code: string | null;
  event: string;
  createdat: Generated<Timestamp | null>;
  metadata: JsonObject | null;
}

/* --------------------------------- Training hub ----------------------------- */

export interface Training {
  id: string;
  name: string;
  description: string | null;
  cohort: string | null;
  start_date: Timestamp;
  end_date: Timestamp;
  category: string;
  facilitator: string | null;
  mode: string;
  duration: string | null;
  capacity: number | null;
  registration_deadline: Timestamp | null;
  template_slug: string;
  created_by_admin_id: string | null;
  createdat: Generated<Timestamp>;
  updatedat: Timestamp;
}

export interface TrainingModule {
  id: string;
  training_id: string;
  title: string;
  sort_order: number;
  createdat: Generated<Timestamp>;
}

export interface TrainingLesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  sort_order: number;
  createdat: Generated<Timestamp>;
}

export interface TrainingEnrollment {
  id: string;
  training_id: string;
  worker_id: string;
  enrollment_type: string;
  nomination_source: string;
  enrolled_at: Generated<Timestamp>;
  completed_at: Timestamp | null;
  idempotency_key: string | null;
}

export interface TrainingParticipation {
  id: string;
  training_id: string;
  worker_id: string;
  session_date: Timestamp;
  status: string;
  createdat: Generated<Timestamp>;
}

export interface TrainingDepartmentAssignment {
  id: string;
  worker_id: string;
  department_id: string;
  training_id: string | null;
  start_date: Timestamp;
  required_duration_days: number;
  createdat: Generated<Timestamp>;
}

export interface TrainingCertificate {
  id: string;
  training_id: string;
  worker_id: string;
  certificate_number: string;
  issued_at: Generated<Timestamp>;
}

export interface TrainingStreamSession {
  id: string;
  training_id: string;
  provider: string;
  provider_room_id: string | null;
  stream_url: string | null;
  screen_share_enabled: boolean;
  chat_enabled: boolean;
  qna_enabled: boolean;
  recording_auto: boolean;
  participant_list_visible: boolean;
  started_at: Timestamp | null;
  ended_at: Timestamp | null;
  createdat: Generated<Timestamp>;
}

export interface TrainingRecording {
  id: string;
  training_id: string;
  stream_session_id: string | null;
  title: string;
  storage_url: string;
  duration_seconds: number | null;
  downloadable: boolean;
  library_visible: boolean;
  createdat: Generated<Timestamp>;
}

export interface ApiIdempotency {
  idempotency_key: string;
  route_scope: string;
  response_status: number;
  response_body: JsonObject;
  createdat: Generated<Timestamp>;
}

/* ------------------------------------ DB ------------------------------------ */

export interface DB {
  worker: Worker;
  admin: Admin;
  attendance: Attendance;
  unique_dates: UniqueDate;
  expirytable: ExpiryTable;
  audit_log: AuditLog;
  training: Training;
  training_module: TrainingModule;
  training_lesson: TrainingLesson;
  training_enrollment: TrainingEnrollment;
  training_participation: TrainingParticipation;
  training_department_assignment: TrainingDepartmentAssignment;
  training_certificate: TrainingCertificate;
  training_stream_session: TrainingStreamSession;
  training_recording: TrainingRecording;
  api_idempotency: ApiIdempotency;
}
