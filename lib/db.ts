import { MongoClient, type Db } from "mongodb";

// Reuse one client across hot reloads in dev and across invocations on a warm serverless instance.
const globalForMongo = globalThis as unknown as { _mongoClient?: Promise<MongoClient> };

/**
 * Returns the app database. Connects lazily, so the app boots (and pages that don't touch the
 * database render) even when MONGODB_URI is missing; only callers get the error.
 */
export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set — copy .env.example to .env.local and fill it in.");

  globalForMongo._mongoClient ??= new MongoClient(uri).connect().catch((err) => {
    globalForMongo._mongoClient = undefined; // allow a retry on the next request
    throw err;
  });
  const client = await globalForMongo._mongoClient;
  return client.db(process.env.MONGODB_DB || "treedorm");
}

/** Closes the shared client (scripts only — the app keeps its connection open). */
export async function closeDb(): Promise<void> {
  const client = await globalForMongo._mongoClient;
  globalForMongo._mongoClient = undefined;
  await client?.close();
}
