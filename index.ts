import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const globalForDb = globalThis as unknown as {
  _pgClient?: ReturnType<typeof postgres>;
};

if (!globalForDb._pgClient) {
  globalForDb._pgClient = postgres(process.env.DATABASE_URL!);
}

export const db = drizzle({ client: globalForDb._pgClient });
