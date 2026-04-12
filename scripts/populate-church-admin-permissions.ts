
/**
 * Populates church_admin_workers.permissions from each row's department label.
 * Run: npx sst shell --stage <stage> -- ts-node scripts/populate-church-admin-permissions.ts
 */
import { sql } from "kysely";
import { db } from "../src/database/db.server";

async function main() {
  const rows = await db
    .selectFrom("church_admin_workers")
    .select(["id", "department", "route"])
    .execute();

  console.log(`Found ${rows.length} church admin worker row(s). Populating permissions from department...`);

  for (const row of rows) {
    const permissions: string[] = row.department ? [row.department] : [];
    const permissionsJson = JSON.stringify(permissions);

    await db
      .updateTable("church_admin_workers")
      .set({
        permissions: sql`CAST(${permissionsJson} AS JSONB)`,
      })
      .where("id", "=", row.id)
      .execute();

    console.log(
      `  id=${row.id} department=${row.department ?? "(null)"} -> permissions=${permissionsJson}`,
    );
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
