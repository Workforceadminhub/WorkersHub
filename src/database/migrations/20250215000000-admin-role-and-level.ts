import type { Kysely } from "kysely";

/**
 * Add role and permission_level to admin table.
 * role: e.g. "super-admin", "admin", "user".
 * permission_level: JSONB array of levels (e.g. ["1", "2"] or ["view", "edit"]).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("admin")
    .addColumn("role", "varchar(64)")
    .addColumn("permission_level", "jsonb")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("admin")
    .dropColumn("role")
    .dropColumn("permission_level")
    .execute();
}
