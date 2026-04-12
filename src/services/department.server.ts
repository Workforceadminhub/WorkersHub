import { db } from "../database/db.server";
import { getUniqueId } from "../utils";
import type { AuthContext } from "../middleware/requireAuth";
import { filterByPermissions } from "../utils/permissions";
import { normalizeDepartmentName } from "../utils/enums";

interface DepartmentInput {
  name: string;
  team: string | null;
  route?: string | null;
  isactive?: boolean | null;
  code?: string | null;
}

interface UpdateDepartmentInput {
  id: string;
  name?: string;
  team?: string | null;
  route?: string | null;
  isactive?: boolean | null;
  code?: string | null;
}

type DepartmentRow = {
  id: string;
  name: string;
  team: string | null;
  route: string | null;
  isactive: boolean;
};

const DepartmentService = () => {
  const listDepartments = async (auth?: AuthContext) => {
    try {
      const rows = await db.selectFrom("department").selectAll().orderBy("name", "asc").execute();

      const fromTable: DepartmentRow[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        team: r.team,
        route: r.route,
        isactive: r.isactive,
      }));

      const existingNames = new Set(fromTable.map((d) => normalizeDepartmentName(d.name)));

      const workerGroups = await db
        .selectFrom("worker")
        .select([(eb) => eb.fn.min("id").as("id"), "department"])
        .where("department", "is not", null)
        .groupBy("department")
        .execute();

      const fromWorkers: DepartmentRow[] = [];
      for (const w of workerGroups) {
        const dn = normalizeDepartmentName(w.department);
        if (!dn || existingNames.has(dn)) continue;
        fromWorkers.push({
          id: String(w.id),
          name: w.department as string,
          team: null,
          route: null,
          isactive: true,
        });
        existingNames.add(dn);
      }

      let departments = [...fromTable, ...fromWorkers];
      if (auth) {
        departments = filterByPermissions(auth, departments, "name");
      }
      return departments;
    } catch (error) {
      console.error("Error listing departments:", (error as Error).message);
      return [];
    }
  };

  const addDepartment = async (input: DepartmentInput) => {
    const name = input.name.trim();
    if (!name) throw new Error("Department name is required");

    const existingRows = await db.selectFrom("department").select(["id", "name"]).execute();
    const dup = existingRows.find((r) => r.name.trim().toLowerCase() === name.toLowerCase());

    if (dup) {
      throw new Error("Department already exists");
    }

    const newId = getUniqueId();
    const now = new Date();
    const inserted = await db
      .insertInto("department")
      .values({
        id: newId,
        name,
        team: input.team || null,
        route: input.route || null,
        code: input.code || null,
        isactive: input.isactive ?? true,
        createdat: now,
        updatedat: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      id: inserted.id,
      name: inserted.name,
      team: inserted.team,
      route: inserted.route,
      isactive: inserted.isactive,
    };
  };

  const toggleDepartmentStatus = async (departmentId: string, isactive: boolean) => {
    const existing = await db
      .selectFrom("department")
      .selectAll()
      .where("id", "=", departmentId)
      .executeTakeFirst();

    if (!existing) {
      throw new Error("Department not found");
    }

    await db
      .updateTable("department")
      .set({
        isactive,
        updatedat: new Date(),
      })
      .where("id", "=", departmentId)
      .execute();

    const updated = await db
      .selectFrom("department")
      .selectAll()
      .where("id", "=", departmentId)
      .executeTakeFirstOrThrow();

    return {
      id: updated.id,
      name: updated.name,
      team: updated.team,
      route: updated.route,
      isactive: updated.isactive,
    };
  };

  const updateDepartment = async (input: UpdateDepartmentInput) => {
    const existing = await db
      .selectFrom("department")
      .selectAll()
      .where("id", "=", input.id)
      .executeTakeFirst();

    if (!existing) {
      throw new Error("Department not found");
    }

    if (input.name && input.name.trim() !== existing.name) {
      const nm = input.name.trim().toLowerCase();
      const others = await db
        .selectFrom("department")
        .select(["id", "name"])
        .where("id", "!=", input.id)
        .execute();
      if (others.some((r) => r.name.trim().toLowerCase() === nm)) {
        throw new Error("Department name already exists");
      }
    }

    const updateValues: Record<string, unknown> = {
      updatedat: new Date(),
    };

    if (input.name !== undefined) {
      updateValues.name = input.name.trim();
    }
    if (input.team !== undefined) {
      updateValues.team = input.team;
    }
    if (input.route !== undefined) {
      updateValues.route = input.route;
    }
    if (input.isactive !== undefined) {
      updateValues.isactive = input.isactive;
    }
    if (input.code !== undefined) {
      updateValues.code = input.code;
    }

    await db.updateTable("department").set(updateValues as any).where("id", "=", input.id).execute();

    const updated = await db
      .selectFrom("department")
      .selectAll()
      .where("id", "=", input.id)
      .executeTakeFirstOrThrow();

    return {
      id: updated.id,
      name: updated.name,
      team: updated.team,
      route: updated.route,
      code: updated.code,
      isactive: updated.isactive,
    };
  };

  const deleteDepartment = async (departmentId: string) => {
    const existing = await db
      .selectFrom("department")
      .selectAll()
      .where("id", "=", departmentId)
      .executeTakeFirst();

    if (!existing) {
      throw new Error("Department not found");
    }

    await db.deleteFrom("department").where("id", "=", departmentId).execute();

    return {
      id: existing.id,
      name: existing.name,
      team: existing.team,
      route: existing.route,
    };
  };

  return {
    listDepartments,
    addDepartment,
    toggleDepartmentStatus,
    updateDepartment,
    deleteDepartment,
  };
};

export default DepartmentService;
