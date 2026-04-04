import { defineConfig, DUMMY_DIALECT_CONFIG } from "kysely-ctl";
import { dialect } from "../src/database/db.server";

export default defineConfig({
  dialect: dialect,
  migrations: {
    allowJS: true,
    migrationFolder: "/src/database/migrations",
  },
  seeds: {
    allowJS: true,
    seedFolder: "/src/database/seeds",
  },
});
