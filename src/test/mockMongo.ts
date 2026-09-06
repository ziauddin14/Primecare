// Minimal in-memory stand-in for the subset of the MongoDB driver this app
// uses (findOne/find/insertOne/updateOne/deleteOne/createIndex), including
// enough query-operator support ($ne, $nin, $in, $exists, $gt(e), $lt(e),
// $or, $and) and unique/partial-index enforcement to let route tests
// exercise real route code - including real concurrency behavior - without
// a live database.
type Doc = Record<string, unknown>;

function matchValue(actual: unknown, expected: unknown): boolean {
  if (expected !== null && typeof expected === "object" && !Array.isArray(expected)) {
    return Object.entries(expected as Record<string, unknown>).every(([op, val]) => {
      switch (op) {
        case "$ne": return String(actual) !== String(val);
        case "$eq": return String(actual) === String(val);
        case "$nin": return !(val as unknown[]).some((v) => String(v) === String(actual));
        case "$in": return (val as unknown[]).some((v) => String(v) === String(actual));
        case "$exists": return (actual !== undefined) === val;
        case "$gte": return (actual as number) >= (val as number);
        case "$lte": return (actual as number) <= (val as number);
        case "$gt": return (actual as number) > (val as number);
        case "$lt": return (actual as number) < (val as number);
        default: return String(actual) === String(expected);
      }
    });
  }
  return String(actual) === String(expected);
}

function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([k, v]) => {
    if (k === "$or") return (v as Doc[]).some((c) => matches(doc, c));
    if (k === "$and") return (v as Doc[]).every((c) => matches(doc, c));
    return matchValue(doc[k], v);
  });
}

interface UniqueIndexSpec {
  fields: string[];
  partialFilter?: (doc: Doc) => boolean;
  name: string;
}

export function createMockCollection(initial: Doc[] = []) {
  let docs: Doc[] = [...initial];
  let counter = 1;
  const uniqueIndexes: UniqueIndexSpec[] = [];

  function findConflict(candidate: Doc, excludeId?: unknown): UniqueIndexSpec | null {
    for (const idx of uniqueIndexes) {
      if (idx.partialFilter && !idx.partialFilter(candidate)) continue;
      const conflict = docs.find((d) => {
        if (excludeId !== undefined && String(d._id) === String(excludeId)) return false;
        if (idx.partialFilter && !idx.partialFilter(d)) return false;
        return idx.fields.every((f) => String(d[f]) === String(candidate[f]));
      });
      if (conflict) return idx;
    }
    return null;
  }

  function duplicateKeyError(spec: UniqueIndexSpec) {
    return Object.assign(
      new Error(`E11000 duplicate key error collection: test.mock index: ${spec.name} dup key`),
      { code: 11000 }
    );
  }

  return {
    async findOne(filter: Doc) {
      return docs.find((d) => matches(d, filter)) ?? null;
    },
    find(filter: Doc = {}) {
      let result = docs.filter((d) => matches(d, filter));
      let skipN = 0;
      let limitN: number | undefined;
      const cursor = {
        sort(spec: Record<string, 1 | -1>) {
          const [[key, dir]] = Object.entries(spec);
          result = [...result].sort((a, b) => {
            const av = a[key] as string | number;
            const bv = b[key] as string | number;
            if (av === bv) return 0;
            return av < bv ? -1 * dir : 1 * dir;
          });
          return cursor;
        },
        skip(n: number) {
          skipN = n;
          return cursor;
        },
        limit(n: number) {
          limitN = n;
          return cursor;
        },
        async toArray() {
          const sliced = result.slice(skipN, limitN !== undefined ? skipN + limitN : undefined);
          return sliced;
        },
      };
      return cursor;
    },
    async insertOne(doc: Doc) {
      const _id = (doc as { _id?: unknown })._id ?? `mock_${counter++}`;
      const candidate = { ...doc, _id };
      const conflict = findConflict(candidate);
      if (conflict) throw duplicateKeyError(conflict);
      docs.push(candidate);
      return { insertedId: _id };
    },
    async updateOne(
      filter: Doc,
      update: { $set?: Doc; $setOnInsert?: Doc; $unset?: Doc; $push?: Doc },
      options: { upsert?: boolean } = {}
    ) {
      const idx = docs.findIndex((d) => matches(d, filter));
      if (idx === -1) {
        if (options.upsert) {
          const _id = `mock_${counter++}`;
          docs.push({ ...(update.$set ?? {}), ...(update.$setOnInsert ?? {}), _id });
          return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
      }

      const merged: Doc = { ...docs[idx], ...(update.$set ?? {}) };
      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) delete merged[key];
      }
      if (update.$push) {
        for (const [key, value] of Object.entries(update.$push)) {
          const arr = Array.isArray(merged[key]) ? [...(merged[key] as unknown[])] : [];
          arr.push(value);
          merged[key] = arr;
        }
      }

      const conflict = findConflict(merged, merged._id);
      if (conflict) throw duplicateKeyError(conflict);

      docs[idx] = merged;
      return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
    },
    async deleteOne(filter: Doc) {
      const before = docs.length;
      docs = docs.filter((d) => !matches(d, filter));
      return { deletedCount: before - docs.length };
    },
    async createIndex(keys: Doc, options: { unique?: boolean; partialFilterExpression?: Doc; name?: string } = {}) {
      const name = options.name || Object.keys(keys).join("_");
      if (options.unique) {
        const partial = options.partialFilterExpression;
        uniqueIndexes.push({
          fields: Object.keys(keys),
          partialFilter: partial ? (doc: Doc) => matches(doc, partial) : undefined,
          name,
        });
      }
      return name;
    },
    _all() {
      return docs;
    },
  };
}

export type MockCollection = ReturnType<typeof createMockCollection>;

export function createMockDb(collections: Record<string, MockCollection>) {
  return {
    collection(name: string) {
      if (!collections[name]) {
        collections[name] = createMockCollection();
      }
      return collections[name];
    },
  };
}

export function createMockClient(collections: Record<string, MockCollection> = {}) {
  const db = createMockDb(collections);
  return { db: () => db, collections };
}
