/**
 * Kysely types for Harvesters Hub (church operations).
 * Primary keys are varchar(26) ULIDs unless noted (server: getUlid / getUniqueId).
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

/* ---------------------------------- ROLES ----------------------------------- */

/** Reference roles for church hub (codes match church_admin_workers.role / JWT). */
export interface ChurchRole {
  code: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  createdat: Generated<Timestamp>;
}

/* -------------------------------- ORGANIZATION ------------------------------- */

export interface Department {
  id: string;
  name: string;
  team: string | null;
  route: string | null;
  code: string | null;
  isactive: boolean;
  createdat: Generated<Timestamp>;
  updatedat: Timestamp;
}

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

/** Staff / leaders who authenticate to the hub (Super Admin … Cell Leader). */
export interface ChurchAdminWorkers {
  id: string;
  code: string | null;
  email: string | null;
  password_hash: string | null;
  reset_password_token: string | null;
  reset_password_expires: Timestamp | null;
  email_verified_at: Timestamp | null;
  email_verification_token: string | null;
  email_verification_expires: Timestamp | null;
  userinfo: string | null;
  linked_church_worker_id: string | null;
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

/* -------------------------------- MEETINGS --------------------------------- */

export interface ChurchMeeting {
  id: string;
  meeting_type: string;
  title: string | null;
  scheduled_date: Timestamp;
  department_id: string | null;
  metadata: JsonObject | null;
  createdat: Generated<Timestamp>;
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
  church_meeting_id: string | null;
}

export interface UniqueDate {
  id: string;
  attendancedate: string;
}

export interface ExpiryTable {
  id: number;
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
  created_by_church_admin_worker_id: string | null;
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

/* --------------------------------- Courses ---------------------------------- */

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string;
  language_code: string;
  image_url: string | null;
  status: string;
  instructor_church_admin_worker_id: string | null;
  published_at: Timestamp | null;
  createdat: Generated<Timestamp>;
  updatedat: Timestamp;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  createdat: Generated<Timestamp>;
}

export interface CourseLecture {
  id: string;
  section_id: string;
  title: string;
  lecture_type: string;
  content_url: string | null;
  duration_seconds: number | null;
  assessment: JsonObject | null;
  sort_order: number;
  createdat: Generated<Timestamp>;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  worker_id: string;
  enrolled_at: Generated<Timestamp>;
  completed_at: Timestamp | null;
  progress: JsonObject | null;
}

/* ----------------------------- Community & operations ------------------------ */

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author_church_admin_worker_id: string | null;
  visibility_department_id: string | null;
  is_published: boolean;
  published_at: Timestamp | null;
  createdat: Generated<Timestamp>;
  updatedat: Timestamp;
}

export interface WelfareRequest {
  id: string;
  worker_id: string;
  subject: string;
  body: string | null;
  status: string;
  createdat: Generated<Timestamp>;
  updatedat: Timestamp;
}

export interface FeedbackEntry {
  id: string;
  worker_id: string;
  category: string | null;
  body: JsonObject;
  createdat: Generated<Timestamp>;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  storage_url: string;
  mime_type: string | null;
  department_scope: string | null;
  uploaded_by_church_admin_worker_id: string | null;
  createdat: Generated<Timestamp>;
}

export interface RecognitionEntry {
  id: string;
  worker_id: string;
  headline: string;
  body: string | null;
  awarded_by_church_admin_worker_id: string | null;
  createdat: Generated<Timestamp>;
}

export interface TeamHealthReport {
  id: string;
  department_id: string;
  period_start: Timestamp;
  period_end: Timestamp;
  summary: JsonObject | null;
  status: string;
  author_church_admin_worker_id: string | null;
  createdat: Generated<Timestamp>;
  updatedat: Timestamp;
}

export interface TeamHealthGoal {
  id: string;
  report_id: string | null;
  department_id: string;
  title: string;
  details: string | null;
  target_date: Timestamp | null;
  goal_status: string;
  createdat: Generated<Timestamp>;
}

export interface GrowthTrackUpload {
  id: string;
  department_id: string;
  upload_label: string;
  file_url: string;
  uploaded_by_church_admin_worker_id: string | null;
  createdat: Generated<Timestamp>;
}

export interface ExportJob {
  id: string;
  job_kind: string;
  status: string;
  output_url: string | null;
  error_message: string | null;
  payload: JsonObject | null;
  requested_by_church_admin_worker_id: string | null;
  createdat: Generated<Timestamp>;
  completed_at: Timestamp | null;
}

/* ------------------------------------ DB ------------------------------------ */

export interface DB {
  church_role: ChurchRole;
  department: Department;
  worker: Worker;
  church_admin_workers: ChurchAdminWorkers;
  church_meeting: ChurchMeeting;
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
  course: Course;
  course_section: CourseSection;
  course_lecture: CourseLecture;
  course_enrollment: CourseEnrollment;
  announcement: Announcement;
  welfare_request: WelfareRequest;
  feedback_entry: FeedbackEntry;
  resource_item: ResourceItem;
  recognition_entry: RecognitionEntry;
  team_health_report: TeamHealthReport;
  team_health_goal: TeamHealthGoal;
  growth_track_upload: GrowthTrackUpload;
  export_job: ExportJob;
}
