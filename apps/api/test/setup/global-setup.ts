import { execSync } from "child_process";

// Runs once before the whole e2e suite. Applies all migrations to whatever
// Postgres DATABASE_URL/DIRECT_URL point at - this MUST be an isolated schema
// (or project) from dev, never the same schema you browse manually, since
// specs truncate tables between runs. Prisma creates the schema named in the
// connection string's `schema` param automatically if it doesn't exist yet.
export default async function globalSetup() {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error(
      "DATABASE_URL/DIRECT_URL must point at the dedicated test Supabase project before running e2e tests. " +
        "See .env.example for the expected shape.",
    );
  }

  execSync("npx prisma migrate deploy", {
    cwd: __dirname + "/../..",
    stdio: "inherit",
  });
}
