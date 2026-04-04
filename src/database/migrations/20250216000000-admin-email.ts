import type { Kysely } from "kysely";

/**
 * Add email column to admin table.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("admin")
    .addColumn("email", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("admin")
    .dropColumn("email")
    .execute();
}
