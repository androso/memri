import { db } from "./database";
import { collections, photos, collectionOwners, users, sessions } from "@shared/schema";
import { eq, and, notInArray, inArray } from "drizzle-orm";
import { deletePhotoFromFirebaseStorage } from "./photo-model";

export class DemoCleanupService {
  private static readonly DEMO_USERNAME = 'demo';
  private static readonly PROTECTED_COLLECTION_IDS = [1, 2, 3, 4, 6];

  /**
   * Clean up all non-protected collections and photos created by demo user
   * This includes both temporary and permanent content
   */
  static async cleanupDemoUserContent(): Promise<void> {
    try {
      console.log('Starting demo user content cleanup...');
      
      // Get demo user ID
      const demoUser = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.username, this.DEMO_USERNAME))
        .limit(1);
      
      if (demoUser.length === 0) {
        console.log('Demo user not found, skipping cleanup');
        return;
      }
      
      const demoUserId = demoUser[0].id;
      console.log(`Found demo user with ID: ${demoUserId}`);
      
      await this.cleanupDemoCollectionsAndPhotos(demoUserId);
      
      console.log('Demo user content cleanup completed successfully');
    } catch (error) {
      console.error('Error during demo user cleanup:', error);
    }
  }

  /**
   * Clean up collections and photos for demo user
   * Preserves protected collections (1, 2, 3, 4, 6)
   */
  private static async cleanupDemoCollectionsAndPhotos(demoUserId: number): Promise<void> {
    try {
      // Get all collections owned by demo user (excluding protected ones)
      const demoCollections = await db
        .select({ 
          id: collections.id,
          name: collections.name 
        })
        .from(collections)
        .innerJoin(collectionOwners, eq(collections.id, collectionOwners.collectionId))
        .where(
          and(
            eq(collectionOwners.userId, demoUserId),
            notInArray(collections.id, this.PROTECTED_COLLECTION_IDS)
          )
        );

      console.log(`Found ${demoCollections.length} non-protected collections owned by demo user`);

      if (demoCollections.length === 0) {
        console.log('No collections to clean up');
        return;
      }

      const collectionIds = demoCollections.map(c => c.id);
      
      // Step 1: Delete all photos in these collections from Firebase Storage
      await this.cleanupPhotosFromFirebaseStorage(collectionIds);
      
      // Step 2: Delete photos from database
      await this.cleanupPhotosFromDatabase(collectionIds);
      
      // Step 3: Delete collection ownership records
      await this.cleanupCollectionOwnerships(collectionIds);
      
      // Step 4: Delete collections from database
      await this.cleanupCollectionsFromDatabase(collectionIds);
      
      console.log(`Successfully cleaned up ${demoCollections.length} collections and their photos`);
    } catch (error) {
      console.error('Error cleaning up demo collections and photos:', error);
      throw error;
    }
  }

  /**
   * Delete photos from Firebase Storage
   */
  private static async cleanupPhotosFromFirebaseStorage(collectionIds: number[]): Promise<void> {
    try {
      // Get all photos in the collections to be deleted
      const photosToDelete = await db
        .select({
          id: photos.id,
          filePath: photos.filePath,
          title: photos.title
        })
        .from(photos)
        .where(inArray(photos.collectionId, collectionIds));

      console.log(`Found ${photosToDelete.length} photos to delete from Firebase Storage`);

      // Delete each photo from Firebase Storage
      for (const photo of photosToDelete) {
        try {
          await deletePhotoFromFirebaseStorage(photo.filePath);
          console.log(`Deleted photo from Firebase: ${photo.title} (${photo.filePath})`);
        } catch (error) {
          console.error(`Failed to delete photo ${photo.id} from Firebase Storage:`, error);
          // Continue with other photos even if one fails
        }
      }
    } catch (error) {
      console.error('Error cleaning up photos from Firebase Storage:', error);
      throw error;
    }
  }

  /**
   * Delete photos from database
   */
  private static async cleanupPhotosFromDatabase(collectionIds: number[]): Promise<void> {
    try {
      const deletedPhotos = await db
        .delete(photos)
        .where(inArray(photos.collectionId, collectionIds))
        .returning({ id: photos.id });

      console.log(`Deleted ${deletedPhotos.length} photos from database`);
    } catch (error) {
      console.error('Error cleaning up photos from database:', error);
      throw error;
    }
  }

  /**
   * Delete collection ownership records
   */
  private static async cleanupCollectionOwnerships(collectionIds: number[]): Promise<void> {
    try {
      const deletedOwnerships = await db
        .delete(collectionOwners)
        .where(inArray(collectionOwners.collectionId, collectionIds))
        .returning({ id: collectionOwners.id });

      console.log(`Deleted ${deletedOwnerships.length} collection ownership records`);
    } catch (error) {
      console.error('Error cleaning up collection ownerships:', error);
      throw error;
    }
  }

  /**
   * Delete collections from database
   */
  private static async cleanupCollectionsFromDatabase(collectionIds: number[]): Promise<void> {
    try {
      const deletedCollections = await db
        .delete(collections)
        .where(inArray(collections.id, collectionIds))
        .returning({ id: collections.id, name: collections.name });

      console.log(`Deleted ${deletedCollections.length} collections from database:`);
      deletedCollections.forEach(collection => {
        console.log(`  - Collection ${collection.id}: ${collection.name}`);
      });
    } catch (error) {
      console.error('Error cleaning up collections from database:', error);
      throw error;
    }
  }

  /**
   * Clean up demo user content when session expires or on logout
   * This is session-aware cleanup
   */
  static async cleanupDemoUserContentForSession(sessionId: string): Promise<void> {
    try {
      console.log(`Starting session-aware demo cleanup for session: ${sessionId}`);
      
      // First check if this session belongs to demo user
      const sessionData = await db
        .select({
          userId: users.id,
          username: users.username
        })
        .from(users)
        .innerJoin(sessions, eq(users.id, sessions.userId))
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (sessionData.length === 0) {
        console.log(`Session ${sessionId} not found`);
        return;
      }

      const { userId, username } = sessionData[0];
      
      if (username !== this.DEMO_USERNAME) {
        console.log(`Session ${sessionId} does not belong to demo user, skipping cleanup`);
        return;
      }

      console.log(`Session ${sessionId} belongs to demo user (${userId}), proceeding with cleanup`);
      
      // Clean up all demo user content
      await this.cleanupDemoCollectionsAndPhotos(userId);
      
      console.log(`Session-aware demo cleanup completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`Error during session-aware demo cleanup for session ${sessionId}:`, error);
    }
  }

  /**
   * Get summary of demo user's current content (for monitoring)
   */
  static async getDemoUserContentSummary(): Promise<{
    totalCollections: number;
    protectedCollections: number;
    nonProtectedCollections: number;
    totalPhotos: number;
  }> {
    try {
      const demoUser = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.username, this.DEMO_USERNAME))
        .limit(1);

      if (demoUser.length === 0) {
        return {
          totalCollections: 0,
          protectedCollections: 0,
          nonProtectedCollections: 0,
          totalPhotos: 0
        };
      }

      const demoUserId = demoUser[0].id;

      // Get all collections owned by demo user
      const allCollections = await db
        .select({ id: collections.id })
        .from(collections)
        .innerJoin(collectionOwners, eq(collections.id, collectionOwners.collectionId))
        .where(eq(collectionOwners.userId, demoUserId));

      const protectedCount = allCollections.filter(c => 
        this.PROTECTED_COLLECTION_IDS.includes(c.id)
      ).length;

      const nonProtectedCount = allCollections.length - protectedCount;

      // Get total photos in all demo user collections
      const collectionIds = allCollections.map(c => c.id);
      const totalPhotos = collectionIds.length > 0 
        ? await db.select({ count: photos.id })
            .from(photos)
            .where(inArray(photos.collectionId, collectionIds))
        : [];

      return {
        totalCollections: allCollections.length,
        protectedCollections: protectedCount,
        nonProtectedCollections: nonProtectedCount,
        totalPhotos: totalPhotos.length
      };
    } catch (error) {
      console.error('Error getting demo user content summary:', error);
      return {
        totalCollections: 0,
        protectedCollections: 0,
        nonProtectedCollections: 0,
        totalPhotos: 0
      };
    }
  }
}