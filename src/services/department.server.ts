import { db } from "../database/db.server";
import { sql } from "kysely";
import type { AuthContext } from "../middleware/requireAuth";
import { filterByPermissions } from "../utils/permissions";

interface DepartmentInput {
  name: string;
  team: string | null;
  route?: string | null;
  isactive?: boolean | null;
  code?: string | null;
}

interface UpdateDepartmentInput {
  id: number;
  name?: string;
  team?: string | null;
  route?: string | null;
  isactive?: boolean | null;
  code?: string | null;
}

const DepartmentService = () => {
  // List all departments with their teams. If auth is provided, returns only departments in auth.permissions (or all for super-admin).
  const listDepartments = async (auth?: AuthContext) => {
    try {
      console.log("Fetching departments from admin table...");
      // Get departments from admin table
      const adminDepartments = await db
        .selectFrom("admin")
        .select(["id", "department", "team", "route", "isactive"])
        .where("department", "is not", null)
        .execute();

      console.log(`Found ${adminDepartments.length} records in admin table`);

      // Also get departments and teams from workers (exclude archived / INACTIVE)
      const allWorkers = await db
        .selectFrom("worker")
        .select(["id", "department", "team"])
        .where("department", "is not", null)
        .where("team", "is not", null)
        .execute();

      console.log(`Found ${allWorkers.length} workers with departments`);

      // Combine and deduplicate - group by department name, get the team
      const departmentMap = new Map<string, { id: number; team: string | null; route: string | null; isactive: boolean | null }>();

      // Add departments from admin table
      adminDepartments.forEach((admin) => {
        if (admin.department) {
          if (!departmentMap.has(admin.department)) {
            departmentMap.set(admin.department, {
              id: admin.id,
              team: admin.team || null,
              route: admin.route,
              isactive: admin.isactive ?? true, // Default to true if null
            });
          }
          // Update route if it exists
          if (admin.route) {
            departmentMap.get(admin.department)!.route = admin.route;
          }
          // Update isactive (take the most restrictive - if any is false, set to false)
          if (admin.isactive === false) {
            departmentMap.get(admin.department)!.isactive = false;
          }
        }
      });

      // Add departments from workers (to catch any that might not be in admin table)
      // Get the first team found for each department
      allWorkers.forEach((w) => {
        if (w.department) {
          if (!departmentMap.has(w.department)) {
            departmentMap.set(w.department, {
              id: w.id,
              team: w.team || null,
              route: null,
              isactive: true,
            });
          }
        }
      });

      // Convert to array format
      let departments = Array.from(departmentMap.entries()).map(([name, data]) => ({
        id: data.id,
        name,
        team: data.team,
        route: data.route,
        isactive: data.isactive,
      }));

      if (auth) {
        departments = filterByPermissions(auth, departments, "name");
      }

      console.log(`Returning ${departments.length} departments`);
      return departments;
    } catch (error) {
      console.error("Error listing departments:", (error as Error).message);
      // Fallback: get from workers only
      try {
        console.log("Using fallback: fetching from workers only...");
        const allWorkers = await db
          .selectFrom("worker")
          .select(["department", "team"])
          .where("department", "is not", null)
          .where("team", "is not", null)
          .execute();

        console.log(`Fallback found ${allWorkers.length} workers with departments`);

        // Deduplicate in memory - get first team for each department
        const fallbackDepartmentMap = new Map<string, string | null>();
        allWorkers.forEach((w) => {
          if (w.department) {
            if (!fallbackDepartmentMap.has(w.department)) {
              fallbackDepartmentMap.set(w.department, w.team || null);
            }
          }
        });

        let fallbackDepts = Array.from(fallbackDepartmentMap.entries()).map(([name, team]) => ({
          name,
          team,
          route: null,
          isactive: true,
        }));
        if (auth) {
          fallbackDepts = filterByPermissions(auth, fallbackDepts, "name");
        }
        return fallbackDepts;
      } catch (fallbackError) {
        console.error("Error in fallback department listing:", (fallbackError as Error).message);
        return [];
      }
    }
  };

  // Add a new department
  const addDepartment = async (input: DepartmentInput) => {
    try {
      // Check if department already exists in admin table
      const existing = await db
        .selectFrom("admin")
        .selectAll()
        .where("department", "=", input.name)
        .executeTakeFirst();

      if (existing) {
        throw new Error("Department already exists");
      }

      // Get the actual last id from admin table (not sequence value)
      const lastRecord = await db
        .selectFrom("admin")
        .select(["id"])
        .orderBy("id", "desc")
        .limit(1)
        .executeTakeFirst();

      const lastId = lastRecord?.id;
      console.log("Last id in admin table:", lastId);
      
      // Calculate new id: lastId + 1, or 1 if no records exist
      const newId = lastId ? lastId + 1 : 1;
      console.log("New id to be inserted:", newId);

      // Insert into admin table with manual id
      const now = new Date();
      const newDepartment = await db
        .insertInto("admin")
        .values({
          id: newId,
          department: input.name,
          team: input.team || null,
          route: input.route || null,
          code: input.code || null,
          userinfo: null,
          workerid: null,
          isactive: input.isactive !== undefined ? input.isactive : true,
          createdat: now,
          updatedat: now,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return {
        id: newDepartment.id,
        name: newDepartment.department,
        team: newDepartment.team,
        route: newDepartment.route,
        isactive: newDepartment.isactive ?? true,
      };
    } catch (error) {
      console.error("Error adding department:", (error as Error).message);
      throw error;
    }
  };

  // Enable or disable a department
  const toggleDepartmentStatus = async (departmentId: number, isactive: boolean) => {
    try {
      // Find the department by id
      const existing = await db
        .selectFrom("admin")
        .selectAll()
        .where("id", "=", departmentId)
        .executeTakeFirst();

      if (!existing) {
        throw new Error("Department not found");
      }

      // Update the department status
      await db
        .updateTable("admin")
        .set({
          isactive,
          updatedat: new Date(),
        })
        .where("id", "=", departmentId)
        .execute();

      const updated = await db
        .selectFrom("admin")
        .selectAll()
        .where("id", "=", departmentId)
        .executeTakeFirstOrThrow();

      return {
        id: updated.id,
        name: updated.department,
        team: updated.team,
        route: updated.route,
        isactive: updated.isactive ?? false,
      };
    } catch (error) {
      console.error("Error toggling department status:", (error as Error).message);
      throw error;
    }
  };

  // Update a department
  const updateDepartment = async (input: UpdateDepartmentInput) => {
    try {
      // Check if department exists
      const existing = await db
        .selectFrom("admin")
        .selectAll()
        .where("id", "=", input.id)
        .executeTakeFirst();

      if (!existing) {
        throw new Error("Department not found");
      }

      // If name is being updated, check if another department with that name exists
      if (input.name && input.name !== existing.department) {
        const nameExists = await db
          .selectFrom("admin")
          .selectAll()
          .where("department", "=", input.name)
          .where("id", "!=", input.id)
          .executeTakeFirst();

        if (nameExists) {
          throw new Error("Department name already exists");
        }
      }

      // Prepare update values - only update fields that are provided
      const updateValues: any = {
        updatedat: new Date(),
      };

      if (input.name !== undefined) {
        updateValues.department = input.name;
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

      // Update the department
      await db
        .updateTable("admin")
        .set(updateValues)
        .where("id", "=", input.id)
        .execute();

      // Fetch the updated department
      const updated = await db
        .selectFrom("admin")
        .selectAll()
        .where("id", "=", input.id)
        .executeTakeFirstOrThrow();

      return {
        id: updated.id,
        name: updated.department,
        team: updated.team,
        route: updated.route,
        code: updated.code,
        isactive: updated.isactive ?? true,
      };
    } catch (error) {
      console.error("Error updating department:", (error as Error).message);
      throw error;
    }
  };

  // Delete a department
  const deleteDepartment = async (departmentId: number) => {
    try {
      // Check if department exists
      const existing = await db
        .selectFrom("admin")
        .selectAll()
        .where("id", "=", departmentId)
        .executeTakeFirst();

      if (!existing) {
        throw new Error("Department not found");
      }

      // Delete the department
      await db
        .deleteFrom("admin")
        .where("id", "=", departmentId)
        .execute();

      return {
        id: existing.id,
        name: existing.department,
        team: existing.team,
        route: existing.route,
      };
    } catch (error) {
      console.error("Error deleting department:", (error as Error).message);
      throw error;
    }
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

