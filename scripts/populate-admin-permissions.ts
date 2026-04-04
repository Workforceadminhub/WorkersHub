/**
 * Populates the admin.permissions column from each admin's department.
 * Run after adding the permissions column: npx sst shell --stage <stage> -- ts-node scripts/populate-admin-permissions.ts
 *
 * For each admin row: sets permissions = [department] when department is not null, else [].
 * Super-admins or users with route containing "super-admin" can be given all departments if desired (edit below).
 */
import { sql } from "kysely";
import { db } from "../src/database/db.server";

async function main() {
  const admins = await db
    .selectFrom("admin")
    .select(["id", "department", "route"])
    .execute();

  console.log(`Found ${admins.length} admin(s). Populating permissions from department...`);

  for (const admin of admins) {
    const permissions: string[] = admin.department ? [admin.department] : [];
    const permissionsJson = JSON.stringify(permissions);

    await db
      .updateTable("admin")
      .set({
        permissions: sql`CAST(${permissionsJson} AS JSONB)`,
      })
      .where("id", "=", admin.id)
      .execute();

    console.log(`  Admin id=${admin.id} department=${admin.department ?? "(null)"} -> permissions=${permissionsJson}`);
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
