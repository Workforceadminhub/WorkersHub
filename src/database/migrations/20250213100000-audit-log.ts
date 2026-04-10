import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Single audit table: logs everything happening in the app for tracking usage.
 * Replaces activity_audit with a simpler schema: event + metadata (method, path, browser, etc.).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("activity_audit").ifExists().execute();
  await db.schema
    .createTable("audit_log")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("user_id", "integer")
    .addColumn("user_code", "varchar(255)")
    .addColumn("event", "varchar(255)", (col) => col.notNull())
    .addColumn("createdat", "timestamptz", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn("metadata", "jsonb")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("audit_log").execute();
}
