export const DB_NAME = new sst.Secret("DB_NAME", process.env.DB_NAME ?? "postgres");
export const DB_CLUSTERS_ARN = new sst.Secret("DB_CLUSTERS_ARN", process.env.DB_CLUSTERS_ARN ?? "postgres");
export const DB_SECRET_ARN = new sst.Secret("DB_SECRET_ARN", process.env.DB_SECRET_ARN ?? "postgres");
export const JWT_SECRET = new sst.Secret("JWT_SECRET", process.env.JWT_SECRET ?? "supersecretkey");
export const BREVO_API_KEY = new sst.Secret("BREVO_API_KEY", process.env.BREVO_API_KEY ?? "brevoapikey");