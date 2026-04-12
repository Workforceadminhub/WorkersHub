import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Courses (lifecycle + curriculum), communications, welfare, feedback, resources,
 * recognition, team health, assimilation growth-track uploads, and async export jobs.
 */

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("course")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("category", "varchar(128)")
    .addColumn("level", "varchar(32)", (col) => col.notNull().defaultTo("beginner"))
    .addColumn("language_code", "varchar(16)", (col) => col.notNull().defaultTo("en"))
    .addColumn("image_url", "text")
    .addColumn("status", "varchar(32)", (col) => col.notNull().defaultTo("draft"))
    .addColumn("instructor_church_admin_worker_id", "varchar(26)", (col) =>
      col.references("church_admin_workers.id").onDelete("set null"),
    )
    .addColumn("published_at", "timestamptz")
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("updatedat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`
    ALTER TABLE course
    ADD CONSTRAINT course_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced'))
  `.execute(db);
  await sql`
    ALTER TABLE course
    ADD CONSTRAINT course_status_check
    CHECK (status IN ('draft', 'in_progress', 'review', 'published'))
  `.execute(db);

  await db.schema
    .createTable("course_section")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("course_id", "varchar(26)", (col) => col.notNull().references("course.id").onDelete("cascade"))
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("sort_order", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("course_lecture")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("section_id", "varchar(26)", (col) => col.notNull().references("course_section.id").onDelete("cascade"))
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("lecture_type", "varchar(20)", (col) => col.notNull())
    .addColumn("content_url", "text")
    .addColumn("duration_seconds", "integer")
    .addColumn("assessment", "jsonb")
    .addColumn("sort_order", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`
    ALTER TABLE course_lecture
    ADD CONSTRAINT course_lecture_type_check
    CHECK (lecture_type IN ('video', 'article', 'quiz'))
  `.execute(db);

  await db.schema
    .createTable("course_enrollment")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("course_id", "varchar(26)", (col) => col.notNull().references("course.id").onDelete("cascade"))
    .addColumn("worker_id", "varchar(26)", (col) => col.notNull().references("worker.id").onDelete("cascade"))
    .addColumn("enrolled_at", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("completed_at", "timestamptz")
    .addColumn("progress", "jsonb")
    .execute();

  await sql`CREATE UNIQUE INDEX course_enrollment_course_worker ON course_enrollment(course_id, worker_id)`.execute(db);

  await db.schema
    .createTable("announcement")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("body", "text", (col) => col.notNull())
    .addColumn("author_church_admin_worker_id", "varchar(26)", (col) =>
      col.references("church_admin_workers.id").onDelete("set null"),
    )
    .addColumn("visibility_department_id", "varchar(26)", (col) => col.references("department.id").onDelete("set null"))
    .addColumn("is_published", "boolean", (col) => col.defaultTo(false).notNull())
    .addColumn("published_at", "timestamptz")
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("updatedat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("welfare_request")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("worker_id", "varchar(26)", (col) => col.notNull().references("worker.id").onDelete("cascade"))
    .addColumn("subject", "varchar(500)", (col) => col.notNull())
    .addColumn("body", "text")
    .addColumn("status", "varchar(32)", (col) => col.notNull().defaultTo("open"))
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("updatedat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`
    ALTER TABLE welfare_request
    ADD CONSTRAINT welfare_request_status_check
    CHECK (status IN ('open', 'in_review', 'approved', 'declined', 'closed'))
  `.execute(db);

  await db.schema
    .createTable("feedback_entry")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("worker_id", "varchar(26)", (col) => col.notNull().references("worker.id").onDelete("cascade"))
    .addColumn("category", "varchar(128)")
    .addColumn("body", "jsonb", (col) => col.notNull())
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("resource_item")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("storage_url", "text", (col) => col.notNull())
    .addColumn("mime_type", "varchar(128)")
    .addColumn("department_scope", "varchar(255)")
    .addColumn("uploaded_by_church_admin_worker_id", "varchar(26)", (col) =>
      col.references("church_admin_workers.id").onDelete("set null"),
    )
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("recognition_entry")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("worker_id", "varchar(26)", (col) => col.notNull().references("worker.id").onDelete("cascade"))
    .addColumn("headline", "varchar(500)", (col) => col.notNull())
    .addColumn("body", "text")
    .addColumn("awarded_by_church_admin_worker_id", "varchar(26)", (col) =>
      col.references("church_admin_workers.id").onDelete("set null"),
    )
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("team_health_report")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("department_id", "varchar(26)", (col) => col.notNull().references("department.id").onDelete("cascade"))
    .addColumn("period_start", "date", (col) => col.notNull())
    .addColumn("period_end", "date", (col) => col.notNull())
    .addColumn("summary", "jsonb")
    .addColumn("status", "varchar(32)", (col) => col.notNull().defaultTo("draft"))
    .addColumn("author_church_admin_worker_id", "varchar(26)", (col) =>
      col.references("church_admin_workers.id").onDelete("set null"),
    )
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("updatedat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("team_health_goal")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("report_id", "varchar(26)", (col) => col.references("team_health_report.id").onDelete("cascade"))
    .addColumn("department_id", "varchar(26)", (col) => col.notNull().references("department.id").onDelete("cascade"))
    .addColumn("title", "varchar(500)", (col) => col.notNull())
    .addColumn("details", "text")
    .addColumn("target_date", "date")
    .addColumn("goal_status", "varchar(32)", (col) => col.notNull().defaultTo("active"))
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await sql`
    ALTER TABLE team_health_goal
    ADD CONSTRAINT team_health_goal_status_check
    CHECK (goal_status IN ('active', 'completed', 'cancelled'))
  `.execute(db);

  await db.schema
    .createTable("growth_track_upload")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("department_id", "varchar(26)", (col) => col.notNull().references("department.id").onDelete("cascade"))
    .addColumn("upload_label", "varchar(255)", (col) => col.notNull())
    .addColumn("file_url", "text", (col) => col.notNull())
    .addColumn("uploaded_by_church_admin_worker_id", "varchar(26)", (col) =>
      col.references("church_admin_workers.id").onDelete("set null"),
    )
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  await db.schema
    .createTable("export_job")
    .addColumn("id", "varchar(26)", (col) => col.primaryKey())
    .addColumn("job_kind", "varchar(32)", (col) => col.notNull())
    .addColumn("status", "varchar(32)", (col) => col.notNull().defaultTo("pending"))
    .addColumn("output_url", "text")
    .addColumn("error_message", "text")
    .addColumn("payload", "jsonb")
    .addColumn("requested_by_church_admin_worker_id", "varchar(26)", (col) =>
      col.references("church_admin_workers.id").onDelete("set null"),
    )
    .addColumn("createdat", "timestamptz", (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn("completed_at", "timestamptz")
    .execute();

  await sql`
    ALTER TABLE export_job
    ADD CONSTRAINT export_job_kind_check
    CHECK (job_kind IN ('csv', 'pdf', 'other'))
  `.execute(db);
  await sql`
    ALTER TABLE export_job
    ADD CONSTRAINT export_job_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("export_job").execute();
  await db.schema.dropTable("growth_track_upload").execute();
  await sql`ALTER TABLE team_health_goal DROP CONSTRAINT IF EXISTS team_health_goal_status_check`.execute(db);
  await db.schema.dropTable("team_health_goal").execute();
  await db.schema.dropTable("team_health_report").execute();
  await db.schema.dropTable("recognition_entry").execute();
  await db.schema.dropTable("resource_item").execute();
  await db.schema.dropTable("feedback_entry").execute();
  await sql`ALTER TABLE welfare_request DROP CONSTRAINT IF EXISTS welfare_request_status_check`.execute(db);
  await db.schema.dropTable("welfare_request").execute();
  await db.schema.dropTable("announcement").execute();
  await sql`DROP INDEX IF EXISTS course_enrollment_course_worker`.execute(db);
  await db.schema.dropTable("course_enrollment").execute();
  await sql`ALTER TABLE course_lecture DROP CONSTRAINT IF EXISTS course_lecture_type_check`.execute(db);
  await db.schema.dropTable("course_lecture").execute();
  await db.schema.dropTable("course_section").execute();
  await sql`ALTER TABLE course DROP CONSTRAINT IF EXISTS course_status_check`.execute(db);
  await sql`ALTER TABLE course DROP CONSTRAINT IF EXISTS course_level_check`.execute(db);
  await db.schema.dropTable("course").execute();
}
