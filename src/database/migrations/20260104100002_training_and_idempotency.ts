import type { Kysely } from "kysely";
import { sql } from "kysely";

/** Trainings, curriculum, enrollments, streaming, certificates, and POST idempotency store. */

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("training")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("name", "varchar(500)", (col) => col.notNull())
    .addColumn("description", "varchar(1500)")
    .addColumn("cohort", "varchar(255)")
    .addColumn("start_date", "date", (col) => col.notNull())
    .addColumn("end_date", "date", (col) => col.notNull())
    .addColumn("category", "varchar(50)", (col) => col.notNull())
    .addColumn("facilitator", "varchar(500)")
    .addColumn("mode", "varchar(20)", (col) => col.notNull())
    .addColumn("duration", "varchar(100)")
    .addColumn("capacity", "integer")
    .addColumn("registration_deadline", "timestamptz")
    .addColumn("template_slug", "varchar(255)", (col) => col.notNull())
    .addColumn("created_by_church_admin_worker_id", "varchar(26)", (col) =>
      col.references("church_admin_workers.id").onDelete("set null"),
    )
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("updatedat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`
    ALTER TABLE training
    ADD CONSTRAINT training_category_check
    CHECK (category IN ('leadership', 'orientation', 'skills'))
  `.execute(db);
  await sql`
    ALTER TABLE training
    ADD CONSTRAINT training_mode_check
    CHECK (mode IN ('physical', 'virtual'))
  `.execute(db);

  await db.schema
    .createTable("training_module")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("training_id", "varchar(26)", (col) => col.notNull().references("training.id").onDelete("cascade"))
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("sort_order", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("training_lesson")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("module_id", "varchar(26)", (col) => col.notNull().references("training_module.id").onDelete("cascade"))
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("content", "text")
    .addColumn("sort_order", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("training_enrollment")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("training_id", "varchar(26)", (col) => col.notNull().references("training.id").onDelete("cascade"))
    .addColumn("worker_id", "varchar(26)", (col) => col.notNull().references("worker.id").onDelete("cascade"))
    .addColumn("enrollment_type", "varchar(20)", (col) => col.notNull())
    .addColumn("nomination_source", "varchar(32)", (col) => col.notNull())
    .addColumn("enrolled_at", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("completed_at", "timestamptz")
    .addColumn("idempotency_key", "varchar(255)")
    .execute();

  await sql`
    ALTER TABLE training_enrollment
    ADD CONSTRAINT training_enrollment_type_check
    CHECK (enrollment_type IN ('primary', 'refresher'))
  `.execute(db);
  await sql`
    ALTER TABLE training_enrollment
    ADD CONSTRAINT training_enrollment_nomination_check
    CHECK (nomination_source IN ('self', 'staff', 'leader'))
  `.execute(db);
  await sql`CREATE UNIQUE INDEX training_enrollment_training_worker ON training_enrollment(training_id, worker_id)`.execute(
    db,
  );
  await sql`CREATE UNIQUE INDEX training_enrollment_idempotency ON training_enrollment(idempotency_key) WHERE idempotency_key IS NOT NULL`.execute(
    db,
  );

  await db.schema
    .createTable("training_participation")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("training_id", "varchar(26)", (col) => col.notNull().references("training.id").onDelete("cascade"))
    .addColumn("worker_id", "varchar(26)", (col) => col.notNull().references("worker.id").onDelete("cascade"))
    .addColumn("session_date", "date", (col) => col.notNull())
    .addColumn("status", "varchar(20)", (col) => col.notNull())
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`
    ALTER TABLE training_participation
    ADD CONSTRAINT training_participation_status_check
    CHECK (status IN ('present', 'absent'))
  `.execute(db);
  await sql`
    CREATE UNIQUE INDEX training_participation_unique
    ON training_participation(training_id, worker_id, session_date)
  `.execute(db);

  await db.schema
    .createTable("training_department_assignment")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("worker_id", "varchar(26)", (col) => col.notNull().references("worker.id").onDelete("cascade"))
    .addColumn("department_id", "varchar(26)", (col) => col.notNull().references("department.id").onDelete("restrict"))
    .addColumn("training_id", "varchar(26)", (col) => col.references("training.id").onDelete("set null"))
    .addColumn("start_date", "date", (col) => col.notNull())
    .addColumn("required_duration_days", "integer", (col) => col.notNull())
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("training_certificate")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("training_id", "varchar(26)", (col) => col.notNull().references("training.id").onDelete("cascade"))
    .addColumn("worker_id", "varchar(26)", (col) => col.notNull().references("worker.id").onDelete("cascade"))
    .addColumn("certificate_number", "varchar(64)", (col) => col.notNull().unique())
    .addColumn("issued_at", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`
    CREATE UNIQUE INDEX training_certificate_training_worker ON training_certificate(training_id, worker_id)
  `.execute(db);

  await db.schema
    .createTable("training_stream_session")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("training_id", "varchar(26)", (col) => col.notNull().references("training.id").onDelete("cascade"))
    .addColumn("provider", "varchar(64)", (col) => col.notNull())
    .addColumn("provider_room_id", "varchar(255)")
    .addColumn("stream_url", "text")
    .addColumn("screen_share_enabled", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("chat_enabled", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("qna_enabled", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("recording_auto", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("participant_list_visible", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("started_at", "timestamptz")
    .addColumn("ended_at", "timestamptz")
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("training_recording")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("training_id", "varchar(26)", (col) => col.notNull().references("training.id").onDelete("cascade"))
    .addColumn("stream_session_id", "varchar(26)", (col) => col.references("training_stream_session.id").onDelete("set null"))
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("storage_url", "text", (col) => col.notNull())
    .addColumn("duration_seconds", "integer")
    .addColumn("downloadable", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("library_visible", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("api_idempotency")
    .addColumn("idempotency_key", "varchar(255)", (col) => col.primaryKey())
    .addColumn("route_scope", "varchar(255)", (col) => col.notNull())
    .addColumn("response_status", "integer", (col) => col.notNull())
    .addColumn("response_body", "jsonb", (col) => col.notNull())
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("api_idempotency").execute();
  await db.schema.dropTable("training_recording").execute();
  await db.schema.dropTable("training_stream_session").execute();
  await sql`DROP INDEX IF EXISTS training_certificate_training_worker`.execute(db);
  await db.schema.dropTable("training_certificate").execute();
  await db.schema.dropTable("training_department_assignment").execute();
  await sql`DROP INDEX IF EXISTS training_participation_unique`.execute(db);
  await db.schema.dropTable("training_participation").execute();
  await sql`DROP INDEX IF EXISTS training_enrollment_idempotency`.execute(db);
  await sql`DROP INDEX IF EXISTS training_enrollment_training_worker`.execute(db);
  await db.schema.dropTable("training_enrollment").execute();
  await db.schema.dropTable("training_lesson").execute();
  await db.schema.dropTable("training_module").execute();
  await db.schema.dropTable("training").execute();
}
