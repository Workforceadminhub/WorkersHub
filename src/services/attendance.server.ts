import { sql } from "kysely";
import { db } from "../database/db.server";
import { getUniqueId } from "../utils";
import { ADMIN_ENUMS, WORKER_STATUS, normalizeDepartmentName } from "../utils/enums";
import { getNextSunday } from "../utils/getDate";

// import { specialDepartments } from "../utils/routeObject";
// import WorkersService from "./workers"; // assumes same pattern
import getDefaultSummary from "../utils/getDefaultSummary";
import { specialDepartments } from "../utils/routeObjects";
import WorkersService from "./workers.server";

const table = "attendance";

const AttendanceService = () => {
  // -------------------------------
  // ADD ATTENDANCE
  // -------------------------------
  const addAttendance = async (attendance: any[]) => {
    const dateForAttendance = getNextSunday();
    console.log("Adding attendance for date:", dateForAttendance);
    console.log("Attendance data:", attendance);

    try {
      // Delete existing entries for same workers on same date
      await db
        .deleteFrom(table)
        .where("attendancedate", "=", dateForAttendance)
        .where(
          "workerid",
          "in",
          attendance.map((a) => a.workerid),
        )
        .execute();

      // Insert new attendance records
      const mappedAttendance = attendance.map((item) => {
        const { id, ...rest } = item; // exclude existing id
        return {
          ...rest,
          id: getUniqueId(),
        };
      });
      await db.insertInto(table).values(mappedAttendance).execute();

      return { success: true };
    } catch (error) {
      console.error("Error adding attendance:", (error as Error).message);
      return null;
    }
  };

  // -------------------------------
  // DEPARTMENT HELPERS
  // -------------------------------
  const getDepartmentSummary = (data: any[]) => {
    const summary: Record<string, number> = {};
    data.forEach((r) => {
      const key = normalizeDepartmentName(r.department);
      if (key) summary[key] = (summary[key] || 0) + 1;
    });
    return summary;
  };

  const getDepartmentTotals = (data: any[]) => {
    const totals: Record<string, number> = {};
    data.forEach((r) => {
      const key = normalizeDepartmentName(r.department);
      if (key) totals[key] = (totals[key] || 0) + 1;
    });
    return totals;
  };

  const updateDefaultSummary = (
    defaultSummary: any[],
    totals: Record<string, number>,
    presentSummary: Record<string, number>,
    unfilledSummary: any[],
  ) => {
    return defaultSummary.map((summary) => {
      const deptKey = normalizeDepartmentName(summary.department);
      const strength = totals[deptKey] || 0;
      const present = presentSummary[deptKey] || 0;
      const unfilled =
        unfilledSummary.filter(
          (item) => normalizeDepartmentName(item.department) === deptKey,
        ).length || 0;

      return {
        ...summary,
        department: deptKey || summary.department,
        total: strength,
        present,
        absent: strength - present - unfilled,
        unfilled,
        percentage: strength > 0 ? `${((present / strength) * 100).toFixed(2)}%` : "0%",
      };
    });
  };

  // -------------------------------
  // FETCH ADMIN ATTENDANCE
  // -------------------------------
  const fetchAdminAttendance = async (
    activeGroup: string,
    isChurchAdmin: boolean,
    activeDate?: string,
    authUser?: any,
  ) => {
    const dateForAttendance = activeDate || getNextSunday();
    if (!authUser) throw new Error("User not authenticated");
    const team = authUser.team || "";

    try {
      const data = await db
        .selectFrom(table)
        .selectAll()
        .where("attendancedate", "=", dateForAttendance)
        .where((eb) => eb.or([eb("attendance", "=", "Present"), eb("attendance", "=", "Online")]))
        .execute();

      const { fetchUnmarkedWorkers } = WorkersService();
      const unfilledData = await fetchUnmarkedWorkers(team, dateForAttendance);

      const workers = await db
        .selectFrom("worker")
        .selectAll()
        .where((eb) =>
          eb.or([
            eb("status", "=", WORKER_STATUS.ACTIVE),
            eb("status", "is", null),
            eb("status", "=", WORKER_STATUS.PENDING_DELETE),
          ]),
        )
        .execute();

      const routes = await db.selectFrom("church_admin_workers").selectAll().execute();

      // Filter routes based on group
      let uniqueRoutes;
      const baseRoutes = routes
        .filter(
          (item, index, self) =>
            index === self.findIndex((obj) => obj.department === item.department),
        )
        .filter(
          (item) => item.department !== null && !specialDepartments.includes(item.department),
        );

      if (activeGroup === "All") {
        uniqueRoutes = baseRoutes;
      } else if (isChurchAdmin) {
        uniqueRoutes = baseRoutes.filter((r) => r.team === activeGroup);
      } else {
        uniqueRoutes = baseRoutes.filter((r) => r.department === activeGroup);
      }

      const departmentTotals = getDepartmentTotals(workers);
      const presentSummary = getDepartmentSummary(data);
      const defaultSummary = getDefaultSummary(
        uniqueRoutes.filter((route) => route.department !== null && route.team !== null) as {
          department: string;
          team: string;
        }[],
      );
      const updatedSummary = updateDefaultSummary(
        defaultSummary,
        departmentTotals,
        presentSummary,
        unfilledData ?? [],
      );

      if (team?.toLowerCase() === ADMIN_ENUMS.ADMIN_TEAM.toLowerCase()) {
        return updatedSummary.sort((a, b) => a.department.localeCompare(b.department));
      }

      return updatedSummary
        .filter((item) => item.team === team)
        .sort((a, b) => a.department.localeCompare(b.department));
    } catch (error) {
      console.error("Error fetching admin attendance:", (error as Error).message);
      return null;
    }
  };

  // -------------------------------
  // FETCH REGULAR ATTENDANCE
  // -------------------------------
  const fetchAttendance = async (
    activeDate?: string,
    authUser?: any,
    permissions?: string[],
  ) => {
    const dateForAttendance = activeDate || getNextSunday();
    if (!authUser) throw new Error("User not authenticated");
    const team = authUser.team || "";

    try {
      let dataQuery = db
        .selectFrom(table)
        .selectAll()
        .where("attendancedate", "=", dateForAttendance)
        .where((eb) => eb.or([eb("attendance", "=", "Present"), eb("attendance", "=", "Online")]));

      // Filter by permissions if provided
      if (permissions && permissions.length > 0) {
        dataQuery = dataQuery.where("department", "in", permissions);
      }

      const data = await dataQuery.execute();

      const { fetchUnmarkedWorkers } = WorkersService();
      const unfilledData = await fetchUnmarkedWorkers(team, dateForAttendance);

      let workersQuery = db
        .selectFrom("worker")
        .selectAll()
        .where((eb) =>
          eb.or([
            eb("status", "=", WORKER_STATUS.ACTIVE),
            eb("status", "is", null),
            eb("status", "=", WORKER_STATUS.PENDING_DELETE),
          ]),
        );

      // Filter workers by permissions if provided
      if (permissions && permissions.length > 0) {
        workersQuery = workersQuery.where("department", "in", permissions);
      }

      const workers = await workersQuery.execute();

      const routes = await db.selectFrom("church_admin_workers").selectAll().execute();

      let uniqueRoutes = routes
        .filter(
          (item, index, self) =>
            index === self.findIndex((obj) => obj.department === item.department),
        )
        .filter(
          (item) => item.department !== null && !specialDepartments.includes(item.department),
        );

      // Filter routes by permissions if provided
      if (permissions && permissions.length > 0) {
        uniqueRoutes = uniqueRoutes.filter((r) => permissions.includes(r.department || ""));
      }

      const departmentTotals = getDepartmentTotals(workers);
      const presentSummary = getDepartmentSummary(data);

      const defaultSummary = getDefaultSummary(
        uniqueRoutes.filter((route) => route.department !== null && route.team !== null) as {
          department: string;
          team: string;
        }[],
      );

      const updatedSummary = updateDefaultSummary(
        defaultSummary,
        departmentTotals,
        presentSummary,
        unfilledData ?? [],
      );

      if (team?.toLowerCase() === ADMIN_ENUMS.ADMIN_TEAM.toLowerCase()) {
        return updatedSummary.sort((a, b) => a.department.localeCompare(b.department));
      }

      return updatedSummary
        .filter((item) => item.team === team)
        .sort((a, b) => a.department.localeCompare(b.department));
    } catch (error) {
      console.error("Error fetching attendance:", (error as Error).message);
      return null;
    }
  };

  // -------------------------------
  // CALCULATE TOTALS
  // -------------------------------
  const calculateTotals = (data: any[]) => {
    const totals = data?.reduce(
      (acc, item) => {
        acc.present += item.present;
        acc.absent += item.absent;
        acc.total += item.total;
        return acc;
      },
      { present: 0, absent: 0, total: 0 },
    );

    const overallPercentage =
      totals?.total === 0 ? "0.00%" : ((totals?.present / totals?.total) * 100).toFixed(2) + "%";

    return [
      { name: "Total strength", stat: totals?.total },
      { name: "Total present", stat: totals?.present },
      { name: "Total absent", stat: totals?.absent },
      { name: "Total percentage", stat: overallPercentage },
    ];
  };

  // const addAttendance = async (attendance: AttendanceRecord[]) => {
  //   const dateForAttendance = getNextSunday();

  //   try {
  //     // === Step 1: Delete existing records for these workers & date ===
  //     await db
  //       .deleteFrom("attendance")
  //       .where("attendancedate", "=", dateForAttendance)
  //       .where(
  //         "workerid",
  //         "in",
  //         attendance.map((a) => a.workerid),
  //       )
  //       .execute();

  //     // === Step 2: Insert new attendance records ===
  //     const inserted = await db
  //       .insertInto("attendance")
  //       .values(attendance)
  //       .returningAll()
  //       .execute();

  //     return inserted;
  //   } catch (error) {
  //     console.error("Error adding attendance:", (error as Error).message);
  //     return null;
  //   }
  // };

  const fetchHistoryOptions = async () => {
    try {
      // Fetch all unique_dates records
      const records = await db.selectFrom("unique_dates").selectAll().execute();

      // Extract unique attendance dates
      //@ts-ignore
      const historyOptions = [...new Set(records.map((item) => item.attendancedate))].reverse();

      // Sort by the date portion after " - "
      const sortedDatesHistoryOption = historyOptions.sort((a, b) => {
        const dateA = new Date(a.split(" - ")[1].split("/").reverse().join("-"));
        const dateB = new Date(b.split(" - ")[1].split("/").reverse().join("-"));
        return dateB.getTime() - dateA.getTime();
      });

      return sortedDatesHistoryOption;
    } catch (error) {
      console.error("Error fetching history options:", (error as Error).message);
      return [];
    }
  };

  const switchOffAttendance = async () => {
    try {
      // Fetch the record with id = 1
      const result = await db.selectFrom("expirytable").selectAll().where("id", "=", 1).execute();

      // Get the value of isClosed (default false if not found)
      const attendanceIsClosed = result.length > 0 ? result[0].isClosed : false;

      return attendanceIsClosed;
    } catch (error) {
      console.error("Error checking attendance status:", (error as Error).message);
      return false;
    }
  };

  const enableAndDisableAttendance = async (isClosed: boolean) => {
    try {
      // Update the record with id = 1
      await db.updateTable("expirytable").set({ isClosed }).where("id", "=", 1).execute();
      return { success: true };
    } catch (error) {
      console.error("Error updating attendance status:", (error as Error).message);
      return { success: false };
    }
  };

  const exportAttendance = async (attendancedate: string) => {
    try {
      const data = await sql`
  SELECT 
    w.phonenumber, 
    a.workerid, 
    a.name, 
    a.attendance, 
    a.department, 
    a.team, 
    a.id
  FROM worker w 
  JOIN attendance a 
    ON w.id = a.workerid
  WHERE a.attendancedate = ${attendancedate}
  ORDER BY w.id;
`.execute(db);

      return data.rows;
    } catch (error) {}
  };

  // -------------------------------
  // ATTENDANCE HISTORY PER DEPARTMENT
  // -------------------------------
  const fetchAttendanceHistory = async (
    permissions?: string[],
    fromDate?: string,
    toDate?: string,
  ) => {
    try {
      let query = db.selectFrom(table).selectAll();

      // Filter by permissions (departments)
      if (permissions && permissions.length > 0) {
        query = query.where("department", "in", permissions);
      }

      // Filter by date range if provided
      if (fromDate) {
        query = query.where("attendancedate", ">=", fromDate);
      }
      if (toDate) {
        query = query.where("attendancedate", "<=", toDate);
      }

      const data = await query.orderBy("attendancedate", "desc").execute();

      // Group by department and date
      const grouped: Record<string, Record<string, any[]>> = {};
      data.forEach((record) => {
        const dept = record.department || "Unknown";
        const date = record.attendancedate || "Unknown";
        if (!grouped[dept]) grouped[dept] = {};
        if (!grouped[dept][date]) grouped[dept][date] = [];
        grouped[dept][date].push(record);
      });

      return grouped;
    } catch (error) {
      console.error("Error fetching attendance history:", (error as Error).message);
      return null;
    }
  };

  // -------------------------------
  // TRENDS: TOP 5 PRESENT/ABSENT WORKERS PER DEPARTMENT
  // -------------------------------
  const fetchAttendanceTrends = async (
    permissions?: string[],
    startDate?: string,
    endDate?: string,
    limitCount: number = 5,
  ) => {
    try {
      const currentYear = new Date().getFullYear();
      const rangeStart = startDate || `${currentYear}-01-01`;
      const rangeEnd = endDate || `${currentYear}-12-31`;

      // attendancedate is stored as "Sunday - 22/2/2026" (weekday - D/M/YYYY); parse for date range
      let query = db
        .selectFrom(table)
        .select([
          "workerid",
          "name",
          "department",
          "attendance",
          sql<number>`COUNT(*)`.as("count"),
        ])
        .where(
          sql<boolean>`TO_DATE(TRIM(SPLIT_PART(attendancedate, ' - ', 2)), 'DD/MM/YYYY') >= ${rangeStart}::date AND TO_DATE(TRIM(SPLIT_PART(attendancedate, ' - ', 2)), 'DD/MM/YYYY') <= ${rangeEnd}::date`,
        )
        .groupBy(["workerid", "name", "department", "attendance"]);

      // Filter by permissions if provided (case-insensitive match)
      if (permissions && permissions.length > 0) {
        const permList = permissions.map((p) => p.trim()).filter(Boolean);
        if (permList.length > 0) {
          query = query.where(
            sql<boolean>`LOWER(TRIM(department)) IN (${sql.join(
              permList.map((p) => sql`LOWER(${p})`),
              sql`, `,
            )})`,
          );
        }
      }

      const data = await query.execute();

      // Aggregate counts per worker per department (sum up all Present records, all Absent records)
      const workerCounts: Record<string, Record<string, { name: string; present: number; absent: number }>> = {};

      data.forEach((record) => {
        const dept = normalizeDepartmentName(record.department) || "Unknown";
        const workerId = record.workerid?.trim() || "unknown";
        const name = record.name || "";
        const count = Number(record.count) || 0;

        if (!workerCounts[dept]) workerCounts[dept] = {};
        if (!workerCounts[dept][workerId]) {
          workerCounts[dept][workerId] = { name, present: 0, absent: 0 };
        }

        if (record.attendance === "Present" || record.attendance === "Online") {
          workerCounts[dept][workerId].present += count;
        } else if (record.attendance === "Absent") {
          workerCounts[dept][workerId].absent += count;
        }
        // Ignore "Not recorded" and other values
      });

      // Convert to arrays and get top 5 for each department
      const result: Record<
        string,
        {
          topPresent: Array<{ workerid: string; name: string; count: number }>;
          topAbsent: Array<{ workerid: string; name: string; count: number }>;
        }
      > = {};

      Object.keys(workerCounts).forEach((dept) => {
        const present: Array<{ workerid: string; name: string; count: number }> = [];
        const absent: Array<{ workerid: string; name: string; count: number }> = [];

        Object.entries(workerCounts[dept]).forEach(([workerId, data]) => {
          if (data.present > 0) {
            present.push({
              workerid: workerId,
              name: data.name,
              count: data.present,
            });
          }
          if (data.absent > 0) {
            absent.push({
              workerid: workerId,
              name: data.name,
              count: data.absent,
            });
          }
        });

        result[dept] = {
          topPresent: present.sort((a, b) => b.count - a.count).slice(0, limitCount),
          topAbsent: absent.sort((a, b) => b.count - a.count).slice(0, limitCount),
        };
      });

      return result;
    } catch (error) {
      console.error("Error fetching attendance trends:", (error as Error).message);
      return null;
    }
  };

  // -------------------------------
  // DELETE ATTENDANCE WITH "Not recorded"
  // -------------------------------
  const deleteNotRecordedAttendance = async () => {
    try {
      await db
        .deleteFrom(table)
        .where("attendance", "=", "Not recorded")
        .execute();
      return { success: true };
    } catch (error) {
      console.error("Error deleting Not recorded attendance:", (error as Error).message);
      return { success: false };
    }
  };

  // -------------------------------
  // DELETE SINGLE ATTENDANCE RECORD
  // -------------------------------
  const deleteAttendanceRecord = async (workerid: string, attendancedate: string) => {
    try {
      const existing = await db
        .selectFrom(table)
        .select(["id"])
        .where("workerid", "=", workerid)
        .where("attendancedate", "=", attendancedate)
        .executeTakeFirst();

      if (!existing) {
        return { success: false, notFound: true };
      }

      await db
        .deleteFrom(table)
        .where("workerid", "=", workerid)
        .where("attendancedate", "=", attendancedate)
        .execute();

      return { success: true };
    } catch (error) {
      console.error("Error deleting attendance record:", (error as Error).message);
      return { success: false };
    }
  };

  return {
    addAttendance,
    fetchAdminAttendance,
    fetchAttendance,
    calculateTotals,
    fetchHistoryOptions,
    switchOffAttendance,
    exportAttendance,
    enableAndDisableAttendance,
    fetchAttendanceHistory,
    fetchAttendanceTrends,
    deleteNotRecordedAttendance,
    deleteAttendanceRecord,
  };
};

export default AttendanceService;
