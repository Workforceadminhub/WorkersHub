import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("activity_audit")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "integer")
    .addColumn("user_code", "varchar(255)")
    .addColumn("action", "varchar(255)", (col) => col.notNull())
    .addColumn("method", "varchar(16)", (col) => col.notNull())
    .addColumn("path", "varchar(1024)", (col) => col.notNull())
    .addColumn("createdat", "timestamptz", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn("metadata", "jsonb")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("activity_audit").execute();
}
