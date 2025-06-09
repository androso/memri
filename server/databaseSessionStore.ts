import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sessions, type Session, type InsertSession } from "@shared/schema";
import { eq, lt } from "drizzle-orm";
import { config } from "dotenv";

// Load environment variables
config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

interface SessionData {
  userId: number;
  username: string;
  expiresAt: Date;
}

class DatabaseSessionStore {
  constructor() {
    // Clean expired sessions every hour
    setInterval(() => {
      this.cleanExpiredSessions();
    }, 60 * 60 * 1000);
    
    // Initial cleanup
    this.cleanExpiredSessions();
  }

  async set(sessionId: string, sessionData: SessionData): Promise<void> {
    try {
      await db.insert(sessions).values({
        id: sessionId,
        userId: sessionData.userId,
        username: sessionData.username,
        expiresAt: sessionData.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: sessions.id,
        set: {
          userId: sessionData.userId,
          username: sessionData.username,
          expiresAt: sessionData.expiresAt,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error setting session:', error);
      throw error;
    }
  }

  async get(sessionId: string): Promise<SessionData | undefined> {
    try {
      const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      const session = result[0];
      
      // Check if session is expired
      if (session.expiresAt < new Date()) {
        // Delete expired session
        await this.delete(sessionId);
        return undefined;
      }
      
      return {
        userId: session.userId,
        username: session.username,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return undefined;
    }
  }

  async delete(sessionId: string): Promise<boolean> {
    try {
      const result = await db.delete(sessions).where(eq(sessions.id, sessionId));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  async has(sessionId: string): Promise<boolean> {
    try {
      const session = await this.get(sessionId);
      return session !== undefined;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }

  async entries(): Promise<[string, SessionData][]> {
    try {
      const allSessions = await db.select().from(sessions).where(
        // Only get non-expired sessions
        eq(sessions.expiresAt, sessions.expiresAt) // This will get all, we'll filter below
      );
      
      const now = new Date();
      const validSessions: [string, SessionData][] = [];
      
      for (const session of allSessions) {
        if (session.expiresAt > now) {
          validSessions.push([
            session.id,
            {
              userId: session.userId,
              username: session.username,
              expiresAt: session.expiresAt,
            }
          ]);
        }
      }
      
      return validSessions;
    } catch (error) {
      console.error('Error getting session entries:', error);
      return [];
    }
  }

  async cleanExpiredSessions(): Promise<void> {
    try {
      const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
      
      if (result.rowCount > 0) {
        console.log(`Cleaned ${result.rowCount} expired sessions from database`);
      }
    } catch (error) {
      console.error('Error cleaning expired sessions:', error);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      await client.end();
    } catch (error) {
      console.error('Error during session store shutdown:', error);
    }
  }

  // Get all sessions for a specific user
  async getUserSessions(userId: number): Promise<SessionData[]> {
    try {
      const userSessions = await db.select().from(sessions).where(eq(sessions.userId, userId));
      
      const now = new Date();
      const validSessions: SessionData[] = [];
      
      for (const session of userSessions) {
        if (session.expiresAt > now) {
          validSessions.push({
            userId: session.userId,
            username: session.username,
            expiresAt: session.expiresAt,
          });
        }
      }
      
      return validSessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Delete all sessions for a specific user (useful for logout from all devices)
  async deleteUserSessions(userId: number): Promise<number> {
    try {
      const result = await db.delete(sessions).where(eq(sessions.userId, userId));
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting user sessions:', error);
      return 0;
    }
  }
}

export const databaseSessionStore = new DatabaseSessionStore();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database session store...');
  await databaseSessionStore.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down database session store...');
  await databaseSessionStore.shutdown();
  process.exit(0);
}); 