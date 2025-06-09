import { collections, collectionOwners, photos, type Collection, type InsertCollection, type CollectionOwner, type InsertCollectionOwner } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./database";
import { getUserPartner } from "./partnership-model";

export async function getCollections(userId: number): Promise<Collection[]> {
  // Get collections where the user is an owner
  const result = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      type: collections.type,
      userId: collections.userId,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .innerJoin(collectionOwners, eq(collections.id, collectionOwners.collectionId))
    .where(eq(collectionOwners.userId, userId))
    .orderBy(desc(collections.createdAt));
  
  return result;
}

export async function getCollectionsWithThumbnails(userId: number): Promise<(Collection & { thumbnailUrl?: string })[]> {
  // Get collections where the user is an owner
  const userCollections = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      type: collections.type,
      userId: collections.userId,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .innerJoin(collectionOwners, eq(collections.id, collectionOwners.collectionId))
    .where(eq(collectionOwners.userId, userId))
    .orderBy(desc(collections.createdAt));
  
  // For each collection, get the first photo if any
  const collectionsWithThumbnails = await Promise.all(
    userCollections.map(async (collection) => {
      const firstPhoto = await db.select()
        .from(photos)
        .where(eq(photos.collectionId, collection.id))
        .orderBy(desc(photos.uploadedAt))
        .limit(1);
      
      return {
        ...collection,
        thumbnailUrl: firstPhoto.length > 0 ? firstPhoto[0].filePath : undefined
      };
    })
  );
  
  return collectionsWithThumbnails;
}

export async function getCollection(id: number): Promise<Collection | undefined> {
  const result = await db.select().from(collections).where(eq(collections.id, id));
  return result[0];
}

export async function createCollection(insertCollection: InsertCollection): Promise<Collection> {
  const result = await db.insert(collections).values({
    ...insertCollection,
    createdAt: new Date()
  }).returning();
  
  const collection = result[0];
  
  // Add the creator as owner
  await db.insert(collectionOwners).values({
    collectionId: collection.id,
    userId: insertCollection.userId!,
    createdAt: new Date()
  });
  
  // Add partner as co-owner if they have one
  const partner = await getUserPartner(insertCollection.userId!);
  if (partner) {
    await db.insert(collectionOwners).values({
      collectionId: collection.id,
      userId: partner.id,
      createdAt: new Date()
    });
  }
  
  return collection;
}

export async function updateCollection(id: number, collectionUpdate: Partial<InsertCollection>): Promise<Collection | undefined> {
  const result = await db.update(collections)
    .set(collectionUpdate)
    .where(eq(collections.id, id))
    .returning();
  return result[0];
}

export async function deleteCollection(id: number): Promise<boolean> {
  // Import here to avoid circular dependency
  const { deletePhotoFromFirebaseStorage } = await import("./photo-model");
  
  // First, get all photos in this collection
  const collectionPhotos = await db.select().from(photos).where(eq(photos.collectionId, id));
  
  // Delete all photos from Firebase Storage and database
  for (const photo of collectionPhotos) {
    // Delete from Firebase Storage
    await deletePhotoFromFirebaseStorage(photo.filePath);
    
    // Delete from database
    await db.delete(photos).where(eq(photos.id, photo.id));
  }
  
  // Delete collection ownership records (will cascade automatically due to foreign key constraints)
  // Finally, delete the collection itself
  const result = await db.delete(collections).where(eq(collections.id, id)).returning();
  return result.length > 0;
}

export async function checkCollectionOwnership(collectionId: number, userId: number): Promise<boolean> {
  const ownership = await db
    .select()
    .from(collectionOwners)
    .where(and(
      eq(collectionOwners.collectionId, collectionId),
      eq(collectionOwners.userId, userId)
    ))
    .limit(1);
  
  return ownership.length > 0;
} 