/**
 * Upserts rows in church_role from the product role catalog (+ legacy JWT codes).
 * Run: npx sst shell --stage <stage> -- ts-node scripts/populate-church-roles.ts
 */
import { db } from "../src/database/db.server";

type RoleRow = {
  code: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Order reflects approximate hierarchy for admin UIs (lower = listed first). */
const CHURCH_ROLES: RoleRow[] = [
  { code: "super-admin", label: "Super Admin", description: null, sort_order: 10, is_active: true },
  { code: "directional-leader", label: "Directional Leader", description: null, sort_order: 20, is_active: true },
  { code: "pastoral-leader", label: "Pastoral Leader", description: null, sort_order: 30, is_active: true },
  { code: "team-head", label: "Team Head", description: null, sort_order: 40, is_active: true },
  { code: "district-pastor", label: "District Pastor", description: null, sort_order: 50, is_active: true },
  { code: "community-leader", label: "Community Leader", description: null, sort_order: 60, is_active: true },
  { code: "zonal-leader", label: "Zonal Leader", description: null, sort_order: 70, is_active: true },
  { code: "sub-team-head", label: "Sub Team Head", description: null, sort_order: 80, is_active: true },
  { code: "HOD", label: "HOD", description: null, sort_order: 90, is_active: true },
  { code: "assistant-hod", label: "Assistant HOD", description: null, sort_order: 100, is_active: true },
  { code: "small-group-leader", label: "Small Group Leader", description: null, sort_order: 110, is_active: true },
  { code: "cell-leader", label: "Cell Leader", description: null, sort_order: 115, is_active: true },
  { code: "worker", label: "Worker", description: null, sort_order: 200, is_active: true },
  // Legacy / alternate codes still referenced in auth code paths
  { code: "admin", label: "Admin (legacy)", description: "Legacy hub role code", sort_order: 500, is_active: true },
  { code: "church-admin", label: "Church Admin (legacy)", description: "Legacy hub role code", sort_order: 510, is_active: true },
  { code: "sub-team-admin", label: "Sub Team Admin (legacy)", description: "Legacy hub role code", sort_order: 520, is_active: true },
  { code: "user", label: "User (legacy)", description: "Legacy hub role code", sort_order: 530, is_active: true },
  { code: "wf-admin", label: "Workflow Admin (dev)", description: "Development / internal", sort_order: 900, is_active: true },
];

async function main() {
  console.log(`Upserting ${CHURCH_ROLES.length} church_role row(s)...`);

  for (const row of CHURCH_ROLES) {
    await db
      .insertInto("church_role")
      .values({
        code: row.code,
        label: row.label,
        description: row.description,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })
      .onConflict((oc) =>
        oc.column("code").doUpdateSet({
          label: row.label,
          description: row.description,
          sort_order: row.sort_order,
          is_active: row.is_active,
        }),
      )
      .execute();

    console.log(`  ${row.code} -> ${row.label}`);
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
