import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

console.log("Connecting to database with URL:", connectionString.replace(/:[^:@]*@/, ':***@'));

// Configure postgres client with better connection settings
export const client = postgres(connectionString, {
  max: 20,                    // Maximum number of connections in pool
  idle_timeout: 20,           // Close idle connections after 20 seconds
  connect_timeout: 10,        // Connection timeout in seconds
  prepare: false,             // Disable prepared statements for better compatibility
  onnotice: () => {},         // Disable notices
  debug: false,               // Disable debug logging
  transform: {
    undefined: null,          // Transform undefined to null
  },
});

export const db = drizzle(client);

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
} 