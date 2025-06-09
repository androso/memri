import { Router, type Request, type Response } from "express";
import { insertCommentSchema } from "@shared/schema";
import { AuthController } from "../controllers/auth";
import { storage } from "../storage";
import { validateSchema, withDatabaseRetry } from "../types";

const router = Router();

// Get comments for a photo (mounted as /api/photos/:id/comments)
router.get('/:photoId/comments', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const photoId = parseInt(req.params.photoId);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }

    // Check if photo exists and user has access to it
    const photo = await storage.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has access to the collection containing this photo
    if (photo.collectionId) {
      const ownership = await storage.checkCollectionOwnership(photo.collectionId, req.user.id);
      if (!ownership) {
        return res.status(403).json({ message: 'Not authorized to view comments for this photo' });
      }
    }

    const comments = await storage.getComments(photoId);
    
    // Get user information for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = comment.userId ? await storage.getUser(comment.userId) : null;
        return {
          ...comment,
          user: user ? { id: user.id, username: user.username, displayName: user.displayName, profilePicture: user.profilePicture } : null
        };
      })
    );
    
    return res.json(commentsWithUsers);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Create comment for a photo (mounted as /api/photos/:id/comments)
router.post('/:photoId/comments', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const photoId = parseInt(req.params.photoId);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }

    // Check if photo exists and user has access to it
    const photo = await storage.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has access to the collection containing this photo
    if (photo.collectionId) {
      const ownership = await storage.checkCollectionOwnership(photo.collectionId, req.user.id);
      if (!ownership) {
        return res.status(403).json({ message: 'Not authorized to comment on this photo' });
      }
    }

    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const data = validateSchema<{
      content: string;
      userId?: number | null;
      photoId?: number | null;
    }>(insertCommentSchema, {
      content: content.trim(),
      photoId,
      userId: req.user.id
    });

    const comment = await withDatabaseRetry(() => storage.createComment(data));
    
    // Return comment with user information
    const user = await storage.getUser(req.user.id);
    const commentWithUser = {
      ...comment,
      user: user ? { id: user.id, username: user.username, displayName: user.displayName, profilePicture: user.profilePicture } : null
    };
    
    return res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error creating comment:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT')) {
        return res.status(503).json({ 
          message: 'Database connection timeout. Please try again in a moment.',
          code: 'DATABASE_TIMEOUT'
        });
      }
      if (error.message.includes('ECONNRESET')) {
        return res.status(503).json({ 
          message: 'Database connection was reset. Please try again.',
          code: 'CONNECTION_RESET'
        });
      }
    }
    
    return res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Failed to create comment',
      code: 'CREATION_FAILED'
    });
  }
});

// Update comment
router.put('/:id', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await storage.getComment(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const data = validateSchema<Partial<{
      content: string;
      userId?: number | null;
      photoId?: number | null;
    }>>(insertCommentSchema.partial(), { content: content.trim() });
    const updatedComment = await storage.updateComment(commentId, data);
    
    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Return comment with user information
    const user = await storage.getUser(req.user.id);
    const commentWithUser = {
      ...updatedComment,
      user: user ? { id: user.id, username: user.username, displayName: user.displayName, profilePicture: user.profilePicture } : null
    };
    
    return res.json(commentWithUser);
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update comment' });
  }
});

// Delete comment
router.delete('/:id', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await storage.getComment(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    const success = await storage.deleteComment(commentId);
    if (success) {
      return res.status(204).end();
    } else {
      return res.status(500).json({ message: 'Failed to delete comment' });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
});

export { router as commentsRouter }; 