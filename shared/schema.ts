import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  profilePicture: text("profile_picture"), // URL to profile picture
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const collectionEnum = pgEnum("collection_type", [
  "nature",
  "travels",
  "favorites",
  "custom"
]);

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: collectionEnum("type").notNull().default("custom"),
  userId: integer("user_id").references(() => users.id), // Keep for backward compatibility
  createdAt: timestamp("created_at").defaultNow(),
  // Temporal storage fields
  isTemporary: boolean("is_temporary").default(false),
  sessionId: text("session_id").references(() => sessions.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at"),
});

export const collectionOwners = pgTable("collection_owners", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueCollectionUser: unique().on(table.collectionId, table.userId),
}));

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  isLiked: boolean("is_liked").default(false),
  collectionId: integer("collection_id").references(() => collections.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  // Temporal storage fields
  isTemporary: boolean("is_temporary").default(false),
  sessionId: text("session_id").references(() => sessions.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at"),
});

// Comments table for photo-level comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  photoId: integer("photo_id").references(() => photos.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for database-based session storage
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partnership table to track user partnerships (1:1 relationship)
export const partnerships = pgTable("partnerships", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: integer("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Ensure each user can only have one partnership
  uniqueUser1: unique().on(table.user1Id),
  uniqueUser2: unique().on(table.user2Id),
}));

// Partnership invitations table for URL-based invites
export const partnershipInvitations = pgTable("partnership_invitations", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: integer("to_user_id").references(() => users.id, { onDelete: "cascade" }), // Can be null for URL invites
  inviteToken: text("invite_token").notNull().unique(), // Unique token for URL invites
  status: text("status", { enum: ["pending", "accepted", "rejected", "expired"] }).notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  profilePicture: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  displayName: true,
  profilePicture: true,
  password: true,
}).partial();

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string()
    .min(1, "Display name is required")
    .max(50, "Display name must be less than 50 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertCollectionSchema = createInsertSchema(collections).pick({
  name: true,
  description: true,
  type: true,
  userId: true,
  isTemporary: true,
  sessionId: true,
  expiresAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  title: true,
  description: true,
  fileName: true,
  fileType: true,
  filePath: true,
  isLiked: true,
  collectionId: true,
  uploadedAt: true,
  isTemporary: true,
  sessionId: true,
  expiresAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  photoId: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
export type User = typeof users.$inferSelect;

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export type CollectionOwner = typeof collectionOwners.$inferSelect;
export type InsertCollectionOwner = typeof collectionOwners.$inferInsert;

export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = typeof partnerships.$inferInsert;

export type PartnershipInvitation = typeof partnershipInvitations.$inferSelect;
export type InsertPartnershipInvitation = typeof partnershipInvitations.$inferInsert;
