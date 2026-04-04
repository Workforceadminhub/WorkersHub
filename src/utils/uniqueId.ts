import { monotonicFactory } from "ulid";

const ulid = monotonicFactory()

export const getUniqueId = () => {
  return ulid();
}