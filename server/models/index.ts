// Re-export all model functions
export * from "./database";
export * from "./user-model";
export * from "./collection-model";
export * from "./photo-model";
export * from "./comment-model";
export * from "./partnership-model";

// Import all functions to create the storage object
import { checkDatabaseHealth } from "./database";
import * as userModel from "./user-model";
import * as collectionModel from "./collection-model";
import * as photoModel from "./photo-model";
import * as commentModel from "./comment-model";
import * as partnershipModel from "./partnership-model";

// Initialize users on startup
async function initialize() {
  try {
    console.log("Initializing database and Firebase Storage...");
    
    // Check if users exist and create them
    await userModel.initializeUsers();
    
    console.log("Database initialization complete");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Create a storage object that matches the original interface for backward compatibility
export const storage = {
  // User operations
  getUser: userModel.getUser,
  getUserByUsername: userModel.getUserByUsername,
  createUser: userModel.createUser,
  updateUser: userModel.updateUser,
  getAllUsers: userModel.getAllUsers,
  
  // Collection operations
  getCollections: collectionModel.getCollections,
  getCollectionsWithThumbnails: collectionModel.getCollectionsWithThumbnails,
  getCollection: collectionModel.getCollection,
  createCollection: collectionModel.createCollection,
  updateCollection: collectionModel.updateCollection,
  deleteCollection: collectionModel.deleteCollection,
  checkCollectionOwnership: collectionModel.checkCollectionOwnership,
  
  // Photo operations
  getPhotos: photoModel.getPhotos,
  getPhoto: photoModel.getPhoto,
  createPhoto: photoModel.createPhoto,
  updatePhoto: photoModel.updatePhoto,
  deletePhoto: photoModel.deletePhoto,
  toggleLikePhoto: photoModel.toggleLikePhoto,
  
  // Comment operations
  getComments: commentModel.getComments,
  getComment: commentModel.getComment,
  createComment: commentModel.createComment,
  updateComment: commentModel.updateComment,
  deleteComment: commentModel.deleteComment,
  
  // Partnership operations
  getUserPartner: partnershipModel.getUserPartner,
  hasPartner: partnershipModel.hasPartner,
  createPartnershipInvitation: partnershipModel.createPartnershipInvitation,
  getInvitationByToken: partnershipModel.getInvitationByToken,
  getUserPendingInvitations: partnershipModel.getUserPendingInvitations,
  acceptPartnershipInvitation: partnershipModel.acceptPartnershipInvitation,
  rejectPartnershipInvitation: partnershipModel.rejectPartnershipInvitation,
  cancelPartnershipInvitation: partnershipModel.cancelPartnershipInvitation,
  cleanupExpiredInvitations: partnershipModel.cleanupExpiredInvitations,
  removePartnership: partnershipModel.removePartnership,
  
  // Firebase Storage operations
  savePhotoToFirebaseStorage: photoModel.savePhotoToFirebaseStorage,
  deletePhotoFromFirebaseStorage: photoModel.deletePhotoFromFirebaseStorage,
};

// Initialize on module load
initialize();

// Export health check separately
export { checkDatabaseHealth }; 