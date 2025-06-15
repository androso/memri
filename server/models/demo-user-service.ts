import { db } from "./database";
import { users, collections, collectionOwners, sessions, type InsertUser } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { AuthService } from "../controllers/auth";
import { DemoCleanupService } from "./demo-cleanup-service";

export class DemoUserService {
  private static readonly DEMO_USER_PREFIX = 'demo_';
  private static readonly PROTECTED_COLLECTION_IDS = [1, 2, 3, 4, 6];
  private static readonly SESSION_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Generate a unique demo username
   */
  private static generateDemoUsername(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.DEMO_USER_PREFIX}${timestamp}_${random}`;
  }

  /**
   * Create a temporary demo user with access to protected collections
   */
  static async createTemporaryDemoUser(): Promise<{
    user: any;
    sessionId: string;
  }> {
    try {
      const username = this.generateDemoUsername();
      const displayName = `Demo User ${username.slice(-8)}`;
      
      console.log(`Creating temporary demo user: ${username}`);

      // Create the demo user
      const userData: InsertUser = {
        username,
        displayName,
        password: await AuthService.hashPassword('demo123'), // Temporary password
        profilePicture: null
      };

      const newUser = await db.insert(users).values(userData).returning();
      const user = newUser[0];

      console.log(`Demo user created with ID: ${user.id}`);

      // Grant access to protected collections
      await this.grantAccessToProtectedCollections(user.id);

      // Create session
      const sessionId = await AuthService.createSession(user.id, user.username);

      // Schedule cleanup for this user when session expires
      setTimeout(async () => {
        try {
          console.log(`Session expired for demo user ${username}, starting cleanup...`);
          await this.cleanupTemporaryDemoUser(user.id, sessionId);
        } catch (error) {
          console.error(`Error during scheduled cleanup for demo user ${username}:`, error);
        }
      }, this.SESSION_DURATION);

      return {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          profilePicture: user.profilePicture
        },
        sessionId
      };
    } catch (error) {
      console.error('Error creating temporary demo user:', error);
      throw error;
    }
  }

  /**
   * Grant access to protected collections for the demo user
   */
  private static async grantAccessToProtectedCollections(userId: number): Promise<void> {
    try {
      // Check which protected collections exist
      const existingCollections = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.id, this.PROTECTED_COLLECTION_IDS[0])); // Check if any exist

      if (existingCollections.length === 0) {
        console.log('No protected collections found, skipping access grant');
        return;
      }

      // Grant ownership to all protected collections
      const ownershipPromises = this.PROTECTED_COLLECTION_IDS.map(async (collectionId) => {
        try {
          // Check if collection exists first
          const collectionExists = await db
            .select({ id: collections.id })
            .from(collections)
            .where(eq(collections.id, collectionId))
            .limit(1);

          if (collectionExists.length > 0) {
            // Check if ownership already exists
            const existingOwnership = await db
              .select()
              .from(collectionOwners)
              .where(
                and(
                  eq(collectionOwners.collectionId, collectionId),
                  eq(collectionOwners.userId, userId)
                )
              )
              .limit(1);

            if (existingOwnership.length === 0) {
              await db.insert(collectionOwners).values({
                collectionId,
                userId
              });
              console.log(`Granted access to collection ${collectionId} for demo user ${userId}`);
            }
          }
        } catch (error) {
          console.error(`Error granting access to collection ${collectionId}:`, error);
        }
      });

      await Promise.all(ownershipPromises);
      console.log(`Access granted to protected collections for demo user ${userId}`);
    } catch (error) {
      console.error('Error granting access to protected collections:', error);
    }
  }

  /**
   * Clean up temporary demo user and all their data
   */
  static async cleanupTemporaryDemoUser(userId: number, sessionId?: string): Promise<void> {
    try {
      console.log(`Starting cleanup for temporary demo user ${userId}`);

      // Get user info for logging
      const user = await db
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const username = user[0]?.username || `ID:${userId}`;

      // 1. Clean up user's non-protected collections and photos
      await this.cleanupUserCollectionsAndPhotos(userId);

      // 2. Remove user's ownership of protected collections (but keep the collections)
      await this.removeProtectedCollectionOwnerships(userId);

      // 3. Delete user's session if provided
      if (sessionId) {
        try {
          await db.delete(sessions).where(eq(sessions.id, sessionId));
          console.log(`Deleted session ${sessionId} for demo user ${username}`);
        } catch (error) {
          console.error(`Error deleting session ${sessionId}:`, error);
        }
      }

      // 4. Delete the user account
      await db.delete(users).where(eq(users.id, userId));
      console.log(`Deleted demo user account: ${username}`);

      console.log(`Cleanup completed for temporary demo user ${username}`);
    } catch (error) {
      console.error(`Error during cleanup for demo user ${userId}:`, error);
    }
  }

  /**
   * Clean up user's collections and photos (excluding protected ones)
   */
  private static async cleanupUserCollectionsAndPhotos(userId: number): Promise<void> {
    try {
      // Use the existing DemoCleanupService logic but adapted for any user
      const userCollections = await db
        .select({ 
          id: collections.id,
          name: collections.name 
        })
        .from(collections)
        .innerJoin(collectionOwners, eq(collections.id, collectionOwners.collectionId))
        .where(eq(collectionOwners.userId, userId));

      // Separate protected and non-protected collections
      const protectedCollections = userCollections.filter(c => 
        this.PROTECTED_COLLECTION_IDS.includes(c.id)
      );
      
      const nonProtectedCollections = userCollections.filter(c => 
        !this.PROTECTED_COLLECTION_IDS.includes(c.id)
      );

      console.log(`User ${userId} has ${protectedCollections.length} protected and ${nonProtectedCollections.length} non-protected collections`);

      if (nonProtectedCollections.length > 0) {
        // Use existing cleanup service for non-protected collections
        const collectionIds = nonProtectedCollections.map(c => c.id);
        await DemoCleanupService['cleanupPhotosFromFirebaseStorage'](collectionIds);
        await DemoCleanupService['cleanupPhotosFromDatabase'](collectionIds);
        await DemoCleanupService['cleanupCollectionOwnerships'](collectionIds);
        await DemoCleanupService['cleanupCollectionsFromDatabase'](collectionIds);
      }
    } catch (error) {
      console.error(`Error cleaning up collections for user ${userId}:`, error);
    }
  }

  /**
   * Remove user's ownership of protected collections without deleting the collections
   */
  private static async removeProtectedCollectionOwnerships(userId: number): Promise<void> {
    try {
      const removedOwnerships = await db
        .delete(collectionOwners)
        .where(
          and(
            eq(collectionOwners.userId, userId),
            // Only remove ownerships for protected collections since others are already cleaned up
            eq(collectionOwners.collectionId, this.PROTECTED_COLLECTION_IDS[0]) // This will be expanded to include all protected collections
          )
        );

      // Remove ownership for each protected collection individually
      for (const collectionId of this.PROTECTED_COLLECTION_IDS) {
        try {
          await db
            .delete(collectionOwners)
            .where(
              and(
                eq(collectionOwners.userId, userId),
                eq(collectionOwners.collectionId, collectionId)
              )
            );
        } catch (error) {
          console.error(`Error removing ownership of collection ${collectionId} for user ${userId}:`, error);
        }
      }

      console.log(`Removed protected collection ownerships for user ${userId}`);
    } catch (error) {
      console.error(`Error removing protected collection ownerships for user ${userId}:`, error);
    }
  }

  /**
   * Check if a username is a temporary demo user
   */
  static isTemporaryDemoUser(username: string): boolean {
    return username.startsWith(this.DEMO_USER_PREFIX);
  }

  /**
   * Get summary of all temporary demo users
   */
  static async getTemporaryDemoUsersSummary(): Promise<{
    totalUsers: number;
    users: Array<{
      id: number;
      username: string;
      displayName: string;
      createdAt: Date | null;
    }>;
  }> {
    try {
      const tempUsers = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          createdAt: users.createdAt
        })
        .from(users); // Get all users and filter in code since LIKE needs special syntax
      
      // Filter for temporary demo users
      const filteredUsers = tempUsers.filter(user => 
        this.isTemporaryDemoUser(user.username)
      );

      return {
        totalUsers: filteredUsers.length,
        users: filteredUsers
      };
    } catch (error) {
      console.error('Error getting temporary demo users summary:', error);
      return {
        totalUsers: 0,
        users: []
      };
    }
  }

  /**
   * Manual cleanup of all expired temporary demo users
   */
  static async cleanupExpiredDemoUsers(): Promise<void> {
    try {
      console.log('Starting cleanup of expired temporary demo users...');
      
      // Get all temporary demo users
      const tempUsers = await db
        .select({
          id: users.id,
          username: users.username
        })
        .from(users);

      const demoUsers = tempUsers.filter(user => 
        this.isTemporaryDemoUser(user.username)
      );

      console.log(`Found ${demoUsers.length} temporary demo users to check`);

      // Check which ones have expired sessions or no active sessions
      for (const user of demoUsers) {
        try {
          const activeSessions = await db
            .select()
            .from(sessions)
            .where(
              and(
                eq(sessions.userId, user.id),
                eq(sessions.expiresAt, new Date()) // Check if not expired
              )
            );

          // If no active sessions, clean up the user
          if (activeSessions.length === 0) {
            console.log(`Cleaning up expired demo user: ${user.username}`);
            await this.cleanupTemporaryDemoUser(user.id);
          }
        } catch (error) {
          console.error(`Error checking sessions for user ${user.username}:`, error);
        }
      }

      console.log('Expired demo users cleanup completed');
    } catch (error) {
      console.error('Error during expired demo users cleanup:', error);
    }
  }
}