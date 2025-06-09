import { partnerships, partnershipInvitations, users, collectionOwners, collections, type Partnership, type InsertPartnership, type PartnershipInvitation, type InsertPartnershipInvitation, type User } from "@shared/schema";
import { eq, and, or, lt, desc } from "drizzle-orm";
import { db } from "./database";
import crypto from "crypto";

// Get user's partner (if any)
export async function getUserPartner(userId: number): Promise<User | null> {
  const partnership = await db
    .select({
      partnerId: partnerships.user1Id,
      partnerIdAlt: partnerships.user2Id,
    })
    .from(partnerships)
    .where(or(
      eq(partnerships.user1Id, userId),
      eq(partnerships.user2Id, userId)
    ))
    .limit(1);

  if (partnership.length === 0) {
    return null;
  }

  // Get the partner's ID (the one that's not the current user)
  const partnerId = partnership[0].partnerId === userId 
    ? partnership[0].partnerIdAlt 
    : partnership[0].partnerId;

  // Get partner's user data
  const partner = await db
    .select()
    .from(users)
    .where(eq(users.id, partnerId))
    .limit(1);

  return partner[0] || null;
}

// Check if user has a partner
export async function hasPartner(userId: number): Promise<boolean> {
  const partnership = await db
    .select()
    .from(partnerships)
    .where(or(
      eq(partnerships.user1Id, userId),
      eq(partnerships.user2Id, userId)
    ))
    .limit(1);

  return partnership.length > 0;
}

// Create a partnership invitation
export async function createPartnershipInvitation(fromUserId: number): Promise<string> {
  // Check if user already has a partner
  if (await hasPartner(fromUserId)) {
    throw new Error("User already has a partner");
  }

  // Check if user already has a pending invitation
  const existingInvitation = await db
    .select()
    .from(partnershipInvitations)
    .where(and(
      eq(partnershipInvitations.fromUserId, fromUserId),
      eq(partnershipInvitations.status, "pending")
    ))
    .limit(1);

  if (existingInvitation.length > 0) {
    throw new Error("User already has a pending invitation");
  }

  // Generate unique invite token
  const inviteToken = crypto.randomBytes(32).toString('hex');
  
  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(partnershipInvitations).values({
    fromUserId,
    inviteToken,
    status: "pending",
    expiresAt,
  });

  return inviteToken;
}

// Get invitation by token
export async function getInvitationByToken(token: string): Promise<(PartnershipInvitation & { fromUser: User }) | null> {
  const invitation = await db
    .select({
      id: partnershipInvitations.id,
      fromUserId: partnershipInvitations.fromUserId,
      toUserId: partnershipInvitations.toUserId,
      inviteToken: partnershipInvitations.inviteToken,
      status: partnershipInvitations.status,
      expiresAt: partnershipInvitations.expiresAt,
      createdAt: partnershipInvitations.createdAt,
      acceptedAt: partnershipInvitations.acceptedAt,
      fromUser: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        profilePicture: users.profilePicture,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }
    })
    .from(partnershipInvitations)
    .innerJoin(users, eq(partnershipInvitations.fromUserId, users.id))
    .where(eq(partnershipInvitations.inviteToken, token))
    .limit(1);

  if (invitation.length === 0) {
    return null;
  }

  const result = invitation[0];
  return {
    ...result,
    fromUser: {
      id: result.fromUser.id,
      username: result.fromUser.username,
      displayName: result.fromUser.displayName,
      profilePicture: result.fromUser.profilePicture,
      createdAt: result.fromUser.createdAt,
      updatedAt: result.fromUser.updatedAt,
      password: '', // Don't expose password
    }
  };
}

// Get pending invitations sent by a user
export async function getUserPendingInvitations(userId: number): Promise<PartnershipInvitation[]> {
  const invitations = await db
    .select()
    .from(partnershipInvitations)
    .where(and(
      eq(partnershipInvitations.fromUserId, userId),
      eq(partnershipInvitations.status, "pending")
    ))
    .orderBy(desc(partnershipInvitations.createdAt));

  return invitations;
}

// Accept partnership invitation
export async function acceptPartnershipInvitation(token: string, acceptingUserId: number): Promise<void> {
  const invitation = await getInvitationByToken(token);
  
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new Error("Invitation is not pending");
  }

  if (new Date() > invitation.expiresAt) {
    throw new Error("Invitation has expired");
  }

  if (invitation.fromUserId === acceptingUserId) {
    throw new Error("Cannot accept your own invitation");
  }

  // Check if either user already has a partner
  if (await hasPartner(invitation.fromUserId) || await hasPartner(acceptingUserId)) {
    throw new Error("One of the users already has a partner");
  }

  // Start transaction
  await db.transaction(async (tx) => {
    // Create partnership
    await tx.insert(partnerships).values({
      user1Id: Math.min(invitation.fromUserId, acceptingUserId), // Ensure consistent ordering
      user2Id: Math.max(invitation.fromUserId, acceptingUserId),
    });

    // Update invitation status
    await tx
      .update(partnershipInvitations)
      .set({
        status: "accepted",
        toUserId: acceptingUserId,
        acceptedAt: new Date(),
      })
      .where(eq(partnershipInvitations.id, invitation.id));

    // Add partner as co-owner to all existing collections of both users
    await addPartnerToExistingCollections(tx, invitation.fromUserId, acceptingUserId);
    await addPartnerToExistingCollections(tx, acceptingUserId, invitation.fromUserId);
  });
}

// Helper function to add partner as co-owner to existing collections
async function addPartnerToExistingCollections(tx: any, ownerId: number, partnerId: number): Promise<void> {
  // Get all collections owned by the user
  const userCollections = await tx
    .select({ collectionId: collectionOwners.collectionId })
    .from(collectionOwners)
    .where(eq(collectionOwners.userId, ownerId));

  // Add partner as co-owner to each collection
  for (const collection of userCollections) {
    // Check if partner is not already an owner
    const existingOwnership = await tx
      .select()
      .from(collectionOwners)
      .where(and(
        eq(collectionOwners.collectionId, collection.collectionId),
        eq(collectionOwners.userId, partnerId)
      ))
      .limit(1);

    if (existingOwnership.length === 0) {
      await tx.insert(collectionOwners).values({
        collectionId: collection.collectionId,
        userId: partnerId,
      });
    }
  }
}

// Reject partnership invitation
export async function rejectPartnershipInvitation(token: string): Promise<void> {
  const invitation = await getInvitationByToken(token);
  
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new Error("Invitation is not pending");
  }

  await db
    .update(partnershipInvitations)
    .set({ status: "rejected" })
    .where(eq(partnershipInvitations.id, invitation.id));
}

// Cancel partnership invitation (by the sender)
export async function cancelPartnershipInvitation(token: string, userId: number): Promise<void> {
  const invitation = await db
    .select()
    .from(partnershipInvitations)
    .where(eq(partnershipInvitations.inviteToken, token))
    .limit(1);
  
  if (invitation.length === 0) {
    throw new Error("Invitation not found");
  }

  const inv = invitation[0];
  
  if (inv.fromUserId !== userId) {
    throw new Error("You can only cancel your own invitations");
  }

  if (inv.status !== "pending") {
    throw new Error("Can only cancel pending invitations");
  }

  await db
    .delete(partnershipInvitations)
    .where(eq(partnershipInvitations.id, inv.id));
}

// Clean up expired invitations
export async function cleanupExpiredInvitations(): Promise<void> {
  await db
    .update(partnershipInvitations)
    .set({ status: "expired" })
    .where(and(
      eq(partnershipInvitations.status, "pending"),
      lt(partnershipInvitations.expiresAt, new Date())
    ));
}

// Remove partnership (for future use)
export async function removePartnership(userId: number): Promise<void> {
  // This would remove the partnership and potentially handle cleanup
  // Implementation depends on requirements for what happens to shared collections
  const partnership = await db
    .select()
    .from(partnerships)
    .where(or(
      eq(partnerships.user1Id, userId),
      eq(partnerships.user2Id, userId)
    ))
    .limit(1);

  if (partnership.length > 0) {
    await db
      .delete(partnerships)
      .where(eq(partnerships.id, partnership[0].id));
  }
} 