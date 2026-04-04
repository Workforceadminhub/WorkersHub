import { env } from "./api";
import { BREVO_API_KEY, DB_CLUSTERS_ARN, DB_NAME, DB_SECRET_ARN, JWT_SECRET } from "./secrets";

export const activateDB = new sst.aws.Function("ActivateDB", {
  handler: "src/handlers/workers/activateDB.handler",
  environment: { ...env },
});

const reportCronFunction = new sst.aws.Function("ReportGeneration", {
  handler: "src/handlers/report/generateReport.handler",
  link: [DB_NAME, DB_CLUSTERS_ARN, DB_SECRET_ARN, JWT_SECRET, BREVO_API_KEY],
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
  timeout: "15 minutes",
  environment: { ...env },
});

// every sunday at midnight
new sst.aws.Cron("WeeklyReportGenerator", {
  function: reportCronFunction.arn,
  schedule: "cron(0 7 ? * SUN *)",
});
