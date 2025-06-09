import { photos, collections, collectionOwners, type Photo, type InsertPhoto } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./database";
import { getFirebaseStorage } from "../firebase";

// Firebase Storage operations
export async function savePhotoToFirebaseStorage(file: Buffer, fileName: string): Promise<string> {
  try {
    const storage = getFirebaseStorage();
    const bucket = storage.bucket();
    const fileRef = bucket.file(`uploads/${fileName}`);
    
    // Detect content type based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'bmp':
        contentType = 'image/bmp';
        break;
      default:
        contentType = 'image/jpeg'; // Default fallback
    }
    
    // Upload the file buffer to Firebase Storage
    await fileRef.save(file, {
      metadata: {
        contentType,
      },
    });
    
    console.log(`Photo uploaded to Firebase Storage: uploads/${fileName} (${contentType})`);
    return fileName; // Return just the filename since we'll serve via our API
  } catch (error) {
    console.error("Error saving photo to Firebase Storage:", error);
    throw new Error("Failed to save photo to Firebase Storage");
  }
}

export async function deletePhotoFromFirebaseStorage(filePath: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const bucket = storage.bucket();
    
    // filePath should be just the filename now
    const fileName = filePath.includes('/') ? filePath.split('/').pop() : filePath;
    const fileRef = bucket.file(`uploads/${fileName}`);
    
    // Delete the file from Firebase Storage
    await fileRef.delete();
    console.log(`Photo deleted from Firebase Storage: uploads/${fileName}`);
  } catch (error) {
    console.error("Error deleting photo from Firebase Storage:", error);
    // Don't throw here as we still want to delete from database
  }
}

// Photo database operations
export async function getPhotos(userId: number, collectionId?: number): Promise<Photo[]> {
  if (collectionId) {
    // Import here to avoid circular dependency
    const { checkCollectionOwnership } = await import("./collection-model");
    
    // First check if user owns this collection
    const hasAccess = await checkCollectionOwnership(collectionId, userId);
    if (!hasAccess) {
      return [];
    }
    
    const result = await db.select().from(photos)
      .where(eq(photos.collectionId, collectionId))
      .orderBy(desc(photos.uploadedAt));
    return result;
  } else {
    // Get all photos from collections that the user owns
    const result = await db.select({
      id: photos.id,
      title: photos.title,
      description: photos.description,
      fileName: photos.fileName,
      fileType: photos.fileType,
      filePath: photos.filePath,
      isLiked: photos.isLiked,
      collectionId: photos.collectionId,
      uploadedAt: photos.uploadedAt,
    }).from(photos)
      .innerJoin(collections, eq(photos.collectionId, collections.id))
      .innerJoin(collectionOwners, eq(collections.id, collectionOwners.collectionId))
      .where(eq(collectionOwners.userId, userId))
      .orderBy(desc(photos.uploadedAt));
    return result;
  }
}

export async function getPhoto(id: number): Promise<Photo | undefined> {
  const result = await db.select().from(photos).where(eq(photos.id, id));
  return result[0];
}

export async function createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
  const result = await db.insert(photos).values({
    ...insertPhoto,
    isLiked: insertPhoto.isLiked || false
  }).returning();
  
  const photo = result[0];
  return photo;
}

export async function updatePhoto(id: number, photoUpdate: Partial<InsertPhoto>): Promise<Photo | undefined> {
  const result = await db.update(photos)
    .set(photoUpdate)
    .where(eq(photos.id, id))
    .returning();
  
  const photo = result[0];
  return photo;
}

export async function deletePhoto(id: number): Promise<boolean> {
  // Get photo information
  const photo = await getPhoto(id);
  if (!photo) return false;
  
  // Delete from Firebase Storage
  await deletePhotoFromFirebaseStorage(photo.filePath);
  
  // Delete from database
  const result = await db.delete(photos).where(eq(photos.id, id)).returning();
  return result.length > 0;
}

export async function toggleLikePhoto(id: number): Promise<Photo | undefined> {
  // Get current photo to check liked status
  const photo = await getPhoto(id);
  if (!photo) return undefined;
  
  // Toggle the liked status
  const result = await db.update(photos)
    .set({ isLiked: !photo.isLiked })
    .where(eq(photos.id, id))
    .returning();
  
  const updatedPhoto = result[0];
  return updatedPhoto;
} 