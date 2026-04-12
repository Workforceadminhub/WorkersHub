import { BREVO_API_KEY, DB_CLUSTERS_ARN, DB_NAME, DB_SECRET_ARN, JWT_SECRET } from "./secrets";

export const api = new sst.aws.ApiGatewayV2("HarvestersApi");

export const env = {
  DB_NAME: process.env.DB_NAME!,
  DB_CLUSTERS_ARN: process.env.DB_CLUSTERS_ARN!,
  DB_SECRET_ARN: process.env.DB_SECRET_ARN!,
  JWT_SECRET: process.env.JWT_SECRET!,
  BREVO_API_KEY: process.env.BREVO_API_KEY!,
  REPORT_EMAILS: process.env.REPORT_EMAILS!,
};

/** Extra env for auth flows (links in email, optional bootstrap gate). */
const authEnv = {
  ...env,
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL ?? "",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "",
  AUTH_BOOTSTRAP_SECRET: process.env.AUTH_BOOTSTRAP_SECRET ?? "",
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL ?? "",
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME ?? "",
};

api.route("POST /api/hub/auth/signin", {
  handler: "src/handlers/auth/login.handler",
  environment: { ...authEnv },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/auth/register", {
  handler: "src/handlers/auth/register.handler",
  environment: { ...authEnv },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET, BREVO_API_KEY],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/auth/bootstrap-super-admin", {
  handler: "src/handlers/auth/bootstrapSuperAdmin.handler",
  environment: { ...authEnv },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/auth/forgot-password", {
  handler: "src/handlers/auth/forgotPassword.handler",
  environment: { ...authEnv },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET, BREVO_API_KEY],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/auth/reset-password", {
  handler: "src/handlers/auth/resetPassword.handler",
  environment: { ...authEnv },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/auth/verify-email", {
  handler: "src/handlers/auth/verifyEmail.handler",
  environment: { ...authEnv },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/auth/verify-email", {
  handler: "src/handlers/auth/verifyEmail.handler",
  environment: { ...authEnv },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/auth/resend-verification", {
  handler: "src/handlers/auth/resendVerification.handler",
  environment: { ...authEnv },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET, BREVO_API_KEY],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/audit", {
  handler: "src/handlers/audit/fetchAudit.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/workers", {
  handler: "src/handlers/workers/fetchWorkers.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/super/admin/workers", {
  handler: "src/handlers/workers/admin/listWorkers.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/super/admin/workers", {
  handler: "src/handlers/workers/admin/createWorker.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});
api.route("POST /api/hub/super/admin/attendance/export", {
  handler: "src/handlers/workers/admin/exportAttendance.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("PUT /api/hub/super/admin/workers", {
  handler: "src/handlers/workers/admin/updateWorker.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("PUT /api/hub/super/admin/{id}/workers/approve", {
  handler: "src/handlers/workers/admin/approveWorker.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});
api.route("PUT /api/hub/super/admin/{id}/workers/approve-remove-worker", {
  handler: "src/handlers/workers/admin/approveRemoveWorker.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("DELETE /api/hub/super/admin/{id}/workers", {
  handler: "src/handlers/workers/admin/deleteWorker.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/super/admin/admins", {
  handler: "src/handlers/admin/listAdmins.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    { actions: ["rds-data:*"], resources: ["*"] },
    { actions: ["secretsmanager:*"], resources: ["*"] },
  ],
});

api.route("POST /api/hub/super/admin/admins", {
  handler: "src/handlers/admin/createAdmin.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    { actions: ["rds-data:*"], resources: ["*"] },
    { actions: ["secretsmanager:*"], resources: ["*"] },
  ],
});

api.route("PUT /api/hub/super/admin/{id}", {
  handler: "src/handlers/admin/updateAdmin.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    { actions: ["rds-data:*"], resources: ["*"] },
    { actions: ["secretsmanager:*"], resources: ["*"] },
  ],
});

api.route("PUT /api/hub/super/admin/{id}/role", {
  handler: "src/handlers/admin/assignRole.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    { actions: ["rds-data:*"], resources: ["*"] },
    { actions: ["secretsmanager:*"], resources: ["*"] },
  ],
});

api.route("PUT /api/hub/super/admin/{id}/permissions", {
  handler: "src/handlers/admin/assignPermissions.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    { actions: ["rds-data:*"], resources: ["*"] },
    { actions: ["secretsmanager:*"], resources: ["*"] },
  ],
});

api.route("DELETE /api/hub/super/admin/{id}", {
  handler: "src/handlers/admin/deleteAdmin.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    { actions: ["rds-data:*"], resources: ["*"] },
    { actions: ["secretsmanager:*"], resources: ["*"] },
  ],
});

api.route("GET /api/hub/super/admin/{id}/workers/details", {
  handler: "src/handlers/workers/admin/getWorkerDetails.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/unmarked/workers", {
  handler: "src/handlers/workers/fetchUnmarked.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/workers/add", {
  handler: "src/handlers/workers/addWorkers.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("PUT /api/hub/workers/requestDelete", {
  handler: "src/handlers/workers/removeWorker.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/attendance/admin", {
  handler: "src/handlers/workers/fetchAdminAttendance.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/attendance", {
  handler: "src/handlers/workers/fetchAttendance.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/attendance/history", {
  handler: "src/handlers/workers/fetchAttendanceHistory.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/attendance/trends", {
  handler: "src/handlers/workers/fetchAttendanceTrends.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

// add attendance api
api.route("POST /api/hub/attendance/add", {
  handler: "src/handlers/workers/addAttendance.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/uniquedates", {
  handler: "src/handlers/workers/getUniqueDates.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("PUT /api/hub/attendance/close", {
  handler: "src/handlers/workers/closeAttendance.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("PUT /api/hub/attendance/enable", {
  handler: "src/handlers/workers/enable.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});
api.route("PUT /api/hub/attendance/disable", {
  handler: "src/handlers/workers/disable.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("DELETE /api/hub/attendance/not-recorded", {
  handler: "src/handlers/workers/deleteNotRecordedAttendance.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("DELETE /api/hub/attendance/record", {
  handler: "src/handlers/workers/deleteAttendanceRecord.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("POST /api/hub/workers/generate/report", {
  handler: "src/handlers/report/generateReport.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

// Department endpoints
api.route("GET /api/hub/departments", {
  handler: "src/handlers/departments/listDepartments.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("GET /api/hub/roles", {
  handler: "src/handlers/roles/listChurchRoles.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    { actions: ["rds-data:*"], resources: ["*"] },
    { actions: ["secretsmanager:*"], resources: ["*"] },
  ],
});

api.route("POST /api/hub/departments", {
  handler: "src/handlers/departments/addDepartment.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("PUT /api/hub/departments/toggle-status", {
  handler: "src/handlers/departments/toggleDepartmentStatus.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("PUT /api/hub/departments", {
  handler: "src/handlers/departments/updateDepartment.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

api.route("DELETE /api/hub/departments/{id}/delete", {
  handler: "src/handlers/departments/deleteDepartment.handler",
  environment: { ...env },
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET],
  timeout: "100 seconds",
  permissions: [
    {
      actions: ["rds-data:*"],
      resources: ["*"],
    },
    {
      actions: ["secretsmanager:*"],
      resources: ["*"],
    },
  ],
});

const trainingLink = [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET];
const trainingPerms = [
  { actions: ["rds-data:*"], resources: ["*"] },
  { actions: ["secretsmanager:*"], resources: ["*"] },
];

api.route("POST /api/hub/trainings", {
  handler: "src/handlers/trainings/createTraining.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/trainings", {
  handler: "src/handlers/trainings/listTrainings.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/trainings/{id}", {
  handler: "src/handlers/trainings/getTrainingDetail.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/trainings/{id}/enrollees", {
  handler: "src/handlers/trainings/getTrainingEnrollees.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/register", {
  handler: "src/handlers/trainings/registerForTraining.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/nominate", {
  handler: "src/handlers/trainings/nominateWorkers.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/modules", {
  handler: "src/handlers/trainings/postTrainingModule.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/modules/{moduleId}/lessons", {
  handler: "src/handlers/trainings/postTrainingLesson.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/trainings/{id}/curriculum", {
  handler: "src/handlers/trainings/getTrainingCurriculum.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/trainings/{id}/worker-curriculum", {
  handler: "src/handlers/trainings/getWorkerTrainingCurriculum.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/participation", {
  handler: "src/handlers/trainings/postTrainingParticipation.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/department-assignments", {
  handler: "src/handlers/trainings/postDepartmentAssignment.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/trainings/{id}/department-assignments", {
  handler: "src/handlers/trainings/listDepartmentAssignments.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/users/{id}/trainings", {
  handler: "src/handlers/trainings/getUserTrainings.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/users/{id}/training-metrics", {
  handler: "src/handlers/trainings/getUserTrainingMetrics.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/enrollments/{enrollmentId}/complete", {
  handler: "src/handlers/trainings/completeEnrollment.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/trainings/{id}/certificates", {
  handler: "src/handlers/trainings/listTrainingCertificates.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/stream-sessions", {
  handler: "src/handlers/trainings/postStreamSession.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("PATCH /api/hub/trainings/{id}/stream-sessions/{streamSessionId}", {
  handler: "src/handlers/trainings/patchStreamSession.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("POST /api/hub/trainings/{id}/recordings", {
  handler: "src/handlers/trainings/postRecording.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

api.route("GET /api/hub/trainings/{id}/recordings", {
  handler: "src/handlers/trainings/listRecordings.handler",
  environment: { ...env },
  link: [...trainingLink],
  timeout: "100 seconds",
  permissions: [...trainingPerms],
});

export const outputs = {
  api: api.routeUrl,
};
