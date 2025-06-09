import { comments, type Comment, type InsertComment } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./database";

export async function getComments(photoId: number): Promise<Comment[]> {
  return await db.select().from(comments)
    .where(eq(comments.photoId, photoId))
    .orderBy(comments.createdAt);
}

export async function getComment(id: number): Promise<Comment | undefined> {
  const result = await db.select().from(comments).where(eq(comments.id, id));
  return result[0];
}

export async function createComment(insertComment: InsertComment): Promise<Comment> {
  const result = await db.insert(comments).values({
    ...insertComment,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();
  return result[0];
}

export async function updateComment(id: number, commentUpdate: Partial<InsertComment>): Promise<Comment | undefined> {
  const result = await db.update(comments)
    .set({ ...commentUpdate, updatedAt: new Date() })
    .where(eq(comments.id, id))
    .returning();
  return result[0];
}

export async function deleteComment(id: number): Promise<boolean> {
  const result = await db.delete(comments).where(eq(comments.id, id)).returning();
  return result.length > 0;
} 