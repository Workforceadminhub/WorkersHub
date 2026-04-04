import type { Kysely } from "kysely";

/**
 * Add approvedat to worker table.
 * Set when a worker is approved (status -> ACTIVE). createdat remains "date added".
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("worker")
    .addColumn("approvedat", "timestamptz")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("worker")
    .dropColumn("approvedat")
    .execute();
}
