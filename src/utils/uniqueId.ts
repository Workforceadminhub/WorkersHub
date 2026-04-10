import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

/** Server-generated monotonic ULID (26 chars). Use for all primary keys. */
export const getUniqueId = () => ulid();

/** Alias for `getUniqueId` — same monotonic ULID factory. */
export const getUlid = getUniqueId;
