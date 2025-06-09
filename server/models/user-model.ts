import { users, type User, type InsertUser, type UpdateUser } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./database";

export async function getUser(id: number): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.username, username));
  return result[0];
}

export async function getAllUsers(): Promise<User[]> {
  const result = await db.select().from(users);
  return result;
}

export async function createUser(insertUser: InsertUser): Promise<User> {
  const result = await db.insert(users).values(insertUser).returning();
  return result[0];
}

export async function updateUser(id: number, userUpdate: UpdateUser): Promise<User | undefined> {
  const result = await db.update(users)
    .set({ ...userUpdate, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

export async function initializeUsers() {
  try {
    // Import bcrypt here to avoid circular dependency
    const bcrypt = await import("bcryptjs");
    
    // Check if demo user exists
    const demo = await getUserByUsername("demo");
    
    if (!demo) {
      console.log("Creating user: demo");
      const hashedPassword = await bcrypt.hash("demo123", 12);
      await createUser({
        username: "demo",
        password: hashedPassword,
        displayName: "Demo User",
        profilePicture: null
      });
    }
    
    console.log("User initialization complete");
  } catch (error) {
    console.error("Error initializing users:", error);
  }
} 