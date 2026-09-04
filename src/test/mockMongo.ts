// Minimal in-memory stand-in for the subset of the MongoDB driver the auth
// layer uses (findOne/insertOne/updateOne/deleteOne/createIndex). Lets the
// auth unit tests exercise real session/user logic without a live database.
type Doc = Record<string, unknown>;

function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([k, v]) => String(doc[k]) === String(v));
}

export function createMockCollection(initial: Doc[] = []) {
  let docs: Doc[] = [...initial];
  let counter = 1;

  return {
    async findOne(filter: Doc) {
      return docs.find((d) => matches(d, filter)) ?? null;
    },
    async insertOne(doc: Doc) {
      const _id = (doc as { _id?: unknown })._id ?? `mock_${counter++}`;
      docs.push({ ...doc, _id });
      return { insertedId: _id };
    },
    async updateOne(filter: Doc, update: { $set?: Doc; $setOnInsert?: Doc }, options: { upsert?: boolean } = {}) {
      const idx = docs.findIndex((d) => matches(d, filter));
      if (idx === -1) {
        if (options.upsert) {
          const _id = `mock_${counter++}`;
          docs.push({ ...(update.$set ?? {}), ...(update.$setOnInsert ?? {}), _id });
          return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
      }
      docs[idx] = { ...docs[idx], ...(update.$set ?? {}) };
      return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
    },
    async deleteOne(filter: Doc) {
      const before = docs.length;
      docs = docs.filter((d) => !matches(d, filter));
      return { deletedCount: before - docs.length };
    },
    async createIndex() {
      return "mock_index";
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
