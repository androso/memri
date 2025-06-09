import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// For migrations
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Running migrations...");
  
  await migrate(db, { migrationsFolder: "migrations" });
  
  console.log("Migrations completed!");
  
  await migrationClient.end();
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed!");
  console.error(e);
  process.exit(1);
});