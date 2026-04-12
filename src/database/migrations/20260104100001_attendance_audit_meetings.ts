import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Weekly attendance, meeting schedule hooks, and unified audit log.
 * church_meeting rows model recurring / named meetings (Tuesday service, e-group, Saturday, etc.).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("church_meeting")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("meeting_type", "varchar(40)", (col) => col.notNull())
    .addColumn("title", "varchar(500)")
    .addColumn("scheduled_date", "date", (col) => col.notNull())
    .addColumn("department_id", "varchar(26)", (col) => col.references("department.id").onDelete("set null"))
    .addColumn("metadata", "jsonb")
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`
    ALTER TABLE church_meeting
    ADD CONSTRAINT church_meeting_type_check
    CHECK (meeting_type IN (
      'tuesday_service',
      'e_group',
      'saturday_service',
      'special_event',
      'training_session',
      'other'
    ))
  `.execute(db);

  await db.schema
    .createTable("unique_dates")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("attendancedate", "varchar(32)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("expirytable")
    .addColumn("id", "integer", (col) => col.primaryKey())
    .addColumn("isClosed", "boolean")
    .execute();

  await sql`INSERT INTO expirytable (id, "isClosed") VALUES (1, false)`.execute(db);

  await db.schema
    .createTable("attendance")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("workerid", "varchar(26)", (col) => col.references("worker.id").onDelete("cascade"))
    .addColumn("name", "varchar(500)", (col) => col.notNull())
    .addColumn("attendance", "varchar(32)", (col) => col.notNull())
    .addColumn("attendancedate", "varchar(32)", (col) => col.notNull())
    .addColumn("department", "varchar(255)")
    .addColumn("team", "varchar(255)")
    .addColumn("church_meeting_id", "varchar(26)", (col) => col.references("church_meeting.id").onDelete("set null"))
    .execute();

  await db.schema
    .createTable("audit_log")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(26)")
    .addColumn("user_code", "varchar(255)")
    .addColumn("event", "varchar(255)", (col) => col.notNull())
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("metadata", "jsonb")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("audit_log").execute();
  await db.schema.dropTable("attendance").execute();
  await db.schema.dropTable("expirytable").execute();
  await db.schema.dropTable("unique_dates").execute();
  await db.schema.dropTable("church_meeting").execute();
}
