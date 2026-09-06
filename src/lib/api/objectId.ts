import { ObjectId } from "mongodb";

// Stricter than ObjectId.isValid alone, which also accepts arbitrary
// 12-byte strings. This only accepts a canonical 24-char hex id, so a
// malformed id from a URL/query/body param is rejected before it ever
// reaches a MongoDB query.
export function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}
