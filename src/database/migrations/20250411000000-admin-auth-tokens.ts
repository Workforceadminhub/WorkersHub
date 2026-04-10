import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Password reset + email verification tokens on admin.
 * Existing rows are treated as already verified at migration time.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("admin")
    .addColumn("reset_password_token", "varchar(128)")
    .addColumn("reset_password_expires", "timestamptz")
    .addColumn("email_verified_at", "timestamptz")
    .addColumn("email_verification_token", "varchar(128)")
    .addColumn("email_verification_expires", "timestamptz")
    .execute();

  await sql`UPDATE admin SET email_verified_at = now() WHERE email_verified_at IS NULL`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("admin")
    .dropColumn("reset_password_token")
    .dropColumn("reset_password_expires")
    .dropColumn("email_verified_at")
    .dropColumn("email_verification_token")
    .dropColumn("email_verification_expires")
    .execute();
}
