import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Greenfield schema: canonical departments, congregation workers, and church admin workers
 * (staff/leaders who sign into the hub — Super Admin through Cell Leader per product roles).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("department")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("team", "varchar(255)")
    .addColumn("route", "varchar(1024)")
    .addColumn("code", "varchar(255)")
    .addColumn("isactive", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("updatedat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`CREATE UNIQUE INDEX department_name_lower_unique ON department (lower(trim(name)))`.execute(db);

  await db.schema
    .createTable("worker")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("identifier", "varchar(255)")
    .addColumn("firstname", "varchar(255)")
    .addColumn("lastname", "varchar(255)")
    .addColumn("email", "varchar(255)")
    .addColumn("maritalstatus", "varchar(64)")
    .addColumn("othername", "varchar(255)")
    .addColumn("phonenumber", "varchar(64)")
    .addColumn("fullname", "varchar(500)")
    .addColumn("department", "varchar(255)")
    .addColumn("team", "varchar(255)")
    .addColumn("workerrole", "varchar(128)")
    .addColumn("fullnamereverse", "varchar(500)")
    .addColumn("ispresent", "boolean")
    .addColumn("isactive", "boolean")
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .addColumn("updatedat", "timestamptz")
    .addColumn("approvedat", "timestamptz")
    .addColumn("birthdate", "varchar(32)")
    .addColumn("agerange", "varchar(64)")
    .addColumn("gender", "varchar(32)")
    .addColumn("address", "text")
    .addColumn("employment", "varchar(255)")
    .addColumn("occupation", "varchar(255)")
    .addColumn("status", "varchar(64)")
    .addColumn("reasonfordelete", "text")
    .addColumn("nameofrequester", "varchar(255)")
    .addColumn("roleofrequester", "varchar(255)")
    .execute();

  await db.schema
    .createTable("church_admin_workers")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("code", "varchar(255)")
    .addColumn("email", "varchar(255)")
    .addColumn("password_hash", "varchar(255)")
    .addColumn("reset_password_token", "varchar(128)")
    .addColumn("reset_password_expires", "timestamptz")
    .addColumn("email_verified_at", "timestamptz")
    .addColumn("email_verification_token", "varchar(128)")
    .addColumn("email_verification_expires", "timestamptz")
    .addColumn("userinfo", "text")
    .addColumn("linked_church_worker_id", "varchar(26)", (col) =>
      col.references("worker.id").onDelete("set null"),
    )
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .addColumn("updatedat", "timestamptz")
    .addColumn("route", "varchar(1024)")
    .addColumn("department", "varchar(255)")
    .addColumn("team", "varchar(255)")
    .addColumn("isactive", "boolean")
    .addColumn("permissions", "jsonb")
    .addColumn("assigned_by", "varchar(26)")
    .addColumn("assigned_date", "timestamptz")
    .addColumn("role", "varchar(64)")
    .addColumn("permission_level", "jsonb")
    .execute();

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS church_admin_workers_email_unique
    ON church_admin_workers (email)
    WHERE email IS NOT NULL AND TRIM(email) <> ''
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS church_admin_workers_email_unique`.execute(db);
  await db.schema.dropTable("church_admin_workers").execute();
  await db.schema.dropTable("worker").execute();
  await sql`DROP INDEX IF EXISTS department_name_lower_unique`.execute(db);
  await db.schema.dropTable("department").execute();
}
