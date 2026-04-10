import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Password-based auth: bcrypt hash on admin. Email is normalized to lowercase in app code;
 * partial unique index prevents duplicate registrations.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("admin").addColumn("password_hash", "varchar(255)").execute();

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS admin_email_unique
    ON admin (email)
    WHERE email IS NOT NULL AND TRIM(email) <> ''
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS admin_email_unique`.execute(db);
  await db.schema.alterTable("admin").dropColumn("password_hash").execute();
}
