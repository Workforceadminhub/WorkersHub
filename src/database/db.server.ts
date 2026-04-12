import { Pool } from "pg";
import { Kysely, ParseJSONResultsPlugin } from "kysely";
import type { DB } from "./db.types";
import { Resource } from "sst";
import { DataApiDialect } from "kysely-data-api";
import { RDSData } from "@aws-sdk/client-rds-data";

const getDialect = () => {
  console.log({ database: Resource.DB_CLUSTERS_ARN.value})
  return new DataApiDialect({
    mode: "postgres",
    driver: {
      client: new RDSData({ region: "eu-west-1" }),
      database:  Resource.DB_NAME.value,
      secretArn: Resource.DB_SECRET_ARN.value,
      resourceArn: Resource.DB_CLUSTERS_ARN.value,
    },
  });
};

export const dialect = getDialect();

// export const db = new Kysely<any>({
//   dialect: new PostgresDialect({
//     pool,
//   }),
// });

export const db = new Kysely<DB>({
  dialect,
  plugins: [new ParseJSONResultsPlugin()],
});

export type TxOrDb = typeof db;
