import type { AuthContext } from "../middleware/requireAuth";
import { ROLES } from "./enums";

/** Normalize one segment: trim and replace URL plus signs with space. */
function normalizeSegment(s: string): string {
  return s.replace(/\+/g, " ").trim();
}

/**
 * Normalize permissions from request (query or body).
 * Supports:
 * - Array of strings (from body or already-parsed query)
 * - JSON array string (e.g. query param: permissions=["Dept A","Dept B"] or %5B%22...%22%5D)
 * - Comma-separated string (e.g. permissions=Dept A,Dept B,Dept C)
 * 
 * IMPORTANT: When department names contain commas (e.g. "Discipleship, Bible Study and Prayer"),
 * use JSON array format to avoid parsing errors. Comma-separated format will split incorrectly.
 */
function parsePermissions(permissions: unknown): string[] {
  if (permissions == null) return [];
  if (Array.isArray(permissions)) {
    return permissions
      .filter((p): p is string => typeof p === "string")
      .map((p) => normalizeSegment(p))
      .filter(Boolean);
  }
  if (typeof permissions === "string") {
    const trimmed = permissions.trim();
    if (!trimmed) return [];
    
    // Always try JSON array first (handles URL-encoded JSON like %5B%22...%22%5D)
    // JSON format is required when department names contain commas
    // Check if it looks like JSON (starts with [ or %5B, or contains quotes)
    const looksLikeJson = trimmed.startsWith("[") || 
                          trimmed.startsWith("%5B") || 
                          trimmed.includes('"') ||
                          trimmed.includes("%22");
    
    if (looksLikeJson) {
      try {
        // Try decoding URL-encoded JSON first
        let decoded = trimmed;
        try {
          decoded = decodeURIComponent(trimmed);
        } catch {
          // If decode fails, use original
          decoded = trimmed;
        }
        const parsed = JSON.parse(decoded) as unknown;
        if (Array.isArray(parsed)) return parsePermissions(parsed);
      } catch {
        // If JSON parsing fails, fall through to comma-separated parsing
      }
    }
    
    // Fallback to comma-separated parsing (only works for simple department names without commas)
    // WARNING: This will fail if department names contain commas (e.g. "Discipleship, Bible Study and Prayer")
    // Frontend should use JSON array format for departments with commas
    return trimmed
      .split(",")
      .map((p) => normalizeSegment(p))
      .filter(Boolean);
  }
  return [];
}

/**
 * Resolve effective list of departments from request params.
 * If department is provided (non-empty), use it as single department.
 * If there is no department (missing or empty), use permissions (comma-separated or JSON array from frontend).
 */
export function getDepartmentsFromRequest(params: {
  department?: string | null;
  permissions?: unknown;
}): string[] {
  const { department, permissions } = params;
  const dept = department != null ? String(department).trim() : "";
  if (dept) return [dept];
  return parsePermissions(permissions);
}

/**
 * Returns true if the user can access the given department/group.
 * Super-admin and users with admin access (route contains /admin/) can access all;
 * others only if the value is in their permissions (case-insensitive).
 */
export function canAccessDepartment(auth: AuthContext, departmentOrTeam: string): boolean {
  if (!departmentOrTeam?.trim()) return false;
  if (auth.role === ROLES.SUPER_ADMIN) return true;
  if (auth.role === ROLES.ADMIN) return true;
  if (auth.role === ROLES.SUB_TEAM_ADMIN) return true;
  if (auth.role === ROLES.CHURCH_ADMIN) return true;
  if (auth.role === ROLES.WF_ADMIN) return true;
  if (auth.role === ROLES.HOD) return true;
  if (auth.route?.includes("/admin/")) return true;
  const perms = auth.permissions ?? [];
  const lower = departmentOrTeam.trim().toLowerCase();
  return perms.some((p) => p.trim().toLowerCase() === lower);
}

/**
 * Filter a list of items that have a department/name field to only those the user can access.
 * Super-admin and users with admin access (route contains /admin/) get all;
 * others get only items whose department is in auth.permissions.
 */
export function filterByPermissions<T extends { department?: string | null; name?: string }>(
  auth: AuthContext,
  items: T[],
  departmentKey: "department" | "name" = "department"
): T[] {
  if (auth.role === ROLES.SUPER_ADMIN) return items;
  if (auth.route?.includes("/admin/")) return items;
  const perms = new Set((auth.permissions ?? []).map((p) => p.trim().toLowerCase()));
  return items.filter((item) => {
    const val = item[departmentKey];
    return val != null && perms.has(String(val).trim().toLowerCase());
  });
}
