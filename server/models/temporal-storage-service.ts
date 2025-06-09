import { db } from "./database";
import { collections, photos, sessions } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";
import { deletePhotoFromFirebaseStorage } from "./photo-model";

export class TemporalStorageService {
  /**
   * Clean up expired temporary collections and photos
   */
  static async cleanExpiredTemporaryContent(): Promise<void> {
    const now = new Date();
    
    try {
      console.log('Starting cleanup of expired temporary content...');
      
      // Get expired temporary photos to delete from Firebase Storage
      const expiredPhotos = await db.select()
        .from(photos)
        .where(
          and(
            eq(photos.isTemporary, true),
            lt(photos.expiresAt, now)
          )
        );
      
      // Delete expired photos from Firebase Storage
      for (const photo of expiredPhotos) {
        try {
          await deletePhotoFromFirebaseStorage(photo.filePath);
        } catch (error) {
          console.error(`Failed to delete photo ${photo.id} from Firebase Storage:`, error);
        }
      }
      
      // Delete expired temporary photos from database
      const deletedPhotos = await db.delete(photos)
        .where(
          and(
            eq(photos.isTemporary, true),
            lt(photos.expiresAt, now)
          )
        );
      
      // Delete expired temporary collections from database
      const deletedCollections = await db.delete(collections)
        .where(
          and(
            eq(collections.isTemporary, true),
            lt(collections.expiresAt, now)
          )
        );
      
      if (deletedPhotos.rowCount > 0 || deletedCollections.rowCount > 0) {
        console.log(`Cleaned up ${deletedPhotos.rowCount} expired temporary photos and ${deletedCollections.rowCount} expired temporary collections`);
      }
      
    } catch (error) {
      console.error('Error cleaning expired temporary content:', error);
    }
  }
  
  /**
   * Convert temporary collection to permanent
   */
  static async makeCollectionPermanent(collectionId: number): Promise<boolean> {
    try {
      const result = await db.update(collections)
        .set({
          isTemporary: false,
          sessionId: null,
          expiresAt: null
        })
        .where(eq(collections.id, collectionId))
        .returning();
      
      if (result.length > 0) {
        console.log(`Collection ${collectionId} converted to permanent storage`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error making collection ${collectionId} permanent:`, error);
      return false;
    }
  }
  
  /**
   * Convert temporary photo to permanent
   */
  static async makePhotoPermanent(photoId: number): Promise<boolean> {
    try {
      const result = await db.update(photos)
        .set({
          isTemporary: false,
          sessionId: null,
          expiresAt: null
        })
        .where(eq(photos.id, photoId))
        .returning();
      
      if (result.length > 0) {
        console.log(`Photo ${photoId} converted to permanent storage`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error making photo ${photoId} permanent:`, error);
      return false;
    }
  }
  
  /**
   * Get temporary content for a specific session
   */
  static async getTemporaryContentBySession(sessionId: string) {
    try {
      const temporaryCollections = await db.select()
        .from(collections)
        .where(
          and(
            eq(collections.isTemporary, true),
            eq(collections.sessionId, sessionId)
          )
        );
      
      const temporaryPhotos = await db.select()
        .from(photos)
        .where(
          and(
            eq(photos.isTemporary, true),
            eq(photos.sessionId, sessionId)
          )
        );
      
      return {
        collections: temporaryCollections,
        photos: temporaryPhotos
      };
    } catch (error) {
      console.error(`Error getting temporary content for session ${sessionId}:`, error);
      return {
        collections: [],
        photos: []
      };
    }
  }
  
  /**
   * Extend expiration time for temporary content in a session
   */
  static async extendTemporaryContentExpiration(sessionId: string, newExpirationTime: Date): Promise<void> {
    try {
      // Update collections
      await db.update(collections)
        .set({ expiresAt: newExpirationTime })
        .where(
          and(
            eq(collections.isTemporary, true),
            eq(collections.sessionId, sessionId)
          )
        );
      
      // Update photos
      await db.update(photos)
        .set({ expiresAt: newExpirationTime })
        .where(
          and(
            eq(photos.isTemporary, true),
            eq(photos.sessionId, sessionId)
          )
        );
      
      console.log(`Extended expiration for temporary content in session ${sessionId} to ${newExpirationTime}`);
    } catch (error) {
      console.error(`Error extending temporary content expiration for session ${sessionId}:`, error);
    }
  }
  
  /**
   * Delete all temporary content for a session (for immediate cleanup on logout)
   */
  static async deleteTemporaryContentForSession(sessionId: string): Promise<void> {
    try {
      // Get photos to delete from Firebase Storage
      const sessionPhotos = await db.select()
        .from(photos)
        .where(
          and(
            eq(photos.isTemporary, true),
            eq(photos.sessionId, sessionId)
          )
        );
      
      // Delete photos from Firebase Storage
      for (const photo of sessionPhotos) {
        try {
          await deletePhotoFromFirebaseStorage(photo.filePath);
        } catch (error) {
          console.error(`Failed to delete photo ${photo.id} from Firebase Storage:`, error);
        }
      }
      
      // Delete photos from database
      await db.delete(photos)
        .where(
          and(
            eq(photos.isTemporary, true),
            eq(photos.sessionId, sessionId)
          )
        );
      
      // Delete collections from database
      await db.delete(collections)
        .where(
          and(
            eq(collections.isTemporary, true),
            eq(collections.sessionId, sessionId)
          )
        );
      
      console.log(`Deleted all temporary content for session ${sessionId}`);
    } catch (error) {
      console.error(`Error deleting temporary content for session ${sessionId}:`, error);
    }
  }
}
