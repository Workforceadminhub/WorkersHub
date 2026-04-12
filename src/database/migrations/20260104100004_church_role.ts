import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Reference table for hub roles (PRD + legacy codes used in JWT / church_admin_workers.role).
 * Frontend lists active rows for pickers; API still validates against ROLES in code as needed.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("church_role")
    .addColumn("code", "varchar(64)", (col) => col.primaryKey())
    .addColumn("label", "varchar(255)", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("sort_order", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("is_active", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`CREATE INDEX church_role_active_sort_idx ON church_role (is_active, sort_order)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS church_role_active_sort_idx`.execute(db);
  await db.schema.dropTable("church_role").execute();
}
