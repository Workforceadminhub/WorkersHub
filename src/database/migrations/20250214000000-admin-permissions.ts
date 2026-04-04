import type { Kysely } from "kysely";

/**
 * Add permission-related columns to admin table.
 * permissions: JSONB array of department names the user can access.
 * assigned_by: admin id who assigned permissions (nullable).
 * assigned_date: when permissions were assigned (nullable).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("admin")
    .addColumn("permissions", "jsonb")
    .addColumn("assigned_by", "integer")
    .addColumn("assigned_date", "timestamptz")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("admin")
    .dropColumn("permissions")
    .dropColumn("assigned_by")
    .dropColumn("assigned_date")
    .execute();
}
