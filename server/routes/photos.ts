import { Router, type Request, type Response } from "express";
import { insertPhotoSchema } from "@shared/schema";
import { AuthController } from "../controllers/auth";
import { storage } from "../storage";
import { upload } from "../multer";
import { validateSchema, generateFileName, withDatabaseRetry, type MulterRequest } from "../types";
import { TemporalStorageService } from "../models/temporal-storage-service";

const router = Router();

// Get all photos
router.get('/', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const collectionId = req.query.collectionId ? parseInt(req.query.collectionId as string) : undefined;
    console.log({collectionId})
    const photos = await storage.getPhotos(req.user.id, collectionId);
    
    return res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return res.status(500).json({ message: 'Failed to fetch photos' });
  }
});

// Create photo
router.post('/', AuthController.requireAuth, upload.single('photo'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    console.log(`Uploading photo for user ${req.user.username}: ${file.originalname} (${file.size} bytes)`);
    
    // Check if user owns the collection before creating the photo
    const collectionId = parseInt(req.body.collectionId);
    if (isNaN(collectionId)) {
      return res.status(400).json({ message: 'Invalid collection ID' });
    }
    
    const hasAccess = await storage.checkCollectionOwnership(collectionId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to add photos to this collection' });
    }
    
    // Generate unique filename and save to Firebase Storage
    const fileName = generateFileName(file.originalname);
    const filePath = await storage.savePhotoToFirebaseStorage(file.buffer, fileName);
    console.log(`Photo saved to Firebase Storage: ${filePath}`);
    
    // Parse temporal storage parameters
    const { isTemporary } = req.body;
    const makeTemporary = isTemporary === 'true' || isTemporary === true;
    const sessionId = makeTemporary ? req.sessionId : null;
    const expiresAt = makeTemporary && sessionId ? new Date(Date.now() + 10 * 60 * 1000) : null;
    
    const data = validateSchema<{
      title: string;
      fileName: string;
      fileType: string;
      filePath: string;
      description?: string | null;
      isLiked?: boolean | null;
      collectionId?: number | null;
      uploadedAt?: Date | string | null;
      isTemporary?: boolean;
      sessionId?: string | null;
      expiresAt?: Date | null;
    }>(insertPhotoSchema, {
      ...req.body,
      fileName: fileName,
      fileType: file.mimetype,
      filePath: filePath,
      collectionId: collectionId,
      isLiked: req.body.isLiked === 'true',
      isTemporary: makeTemporary,
      sessionId,
      expiresAt
    });

    const photo = await withDatabaseRetry(() => storage.createPhoto(data));
    console.log(`Photo saved to database successfully: ${photo.id}`);
    
    return res.status(201).json(photo);
  } catch (error) {
    console.error('Error creating photo:', error);
    
    // Provide more specific error messages
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
      message: error instanceof Error ? error.message : 'Failed to create photo',
      code: 'CREATION_FAILED'
    });
  }
});

// Get single photo
router.get('/:id', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const photoId = parseInt(req.params.id);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }

    const photo = await storage.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user owns the collection containing this photo
    if (photo.collectionId) {
      const hasAccess = await storage.checkCollectionOwnership(photo.collectionId, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to access this photo' });
      }
    }

    return res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    return res.status(500).json({ message: 'Failed to fetch photo' });
  }
});

// Update photo
router.put('/:id', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const photoId = parseInt(req.params.id);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }

    const photo = await storage.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user owns the collection containing this photo
    if (photo.collectionId) {
      const hasAccess = await storage.checkCollectionOwnership(photo.collectionId, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to update this photo' });
      }
    }

    const data = validateSchema<Partial<{
      title: string;
      fileName: string;
      fileType: string;
      filePath: string;
      description?: string | null;
      isLiked?: boolean | null;
      collectionId?: number | null;
      uploadedAt?: Date | string | null;
    }>>(insertPhotoSchema.partial(), req.body);
    const updatedPhoto = await storage.updatePhoto(photoId, data);
    return res.json(updatedPhoto);
  } catch (error) {
    console.error('Error updating photo:', error);
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update photo' });
  }
});

// Like/unlike photo
router.post('/:id/like', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const photoId = parseInt(req.params.id);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }

    const photo = await storage.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user owns the collection containing this photo
    if (photo.collectionId) {
      const hasAccess = await storage.checkCollectionOwnership(photo.collectionId, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to like this photo' });
      }
    }

    const updatedPhoto = await storage.toggleLikePhoto(photoId);
    return res.json(updatedPhoto);
  } catch (error) {
    console.error('Error toggling like on photo:', error);
    return res.status(500).json({ message: 'Failed to toggle like on photo' });
  }
});

// Delete photo
router.delete('/:id', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const photoId = parseInt(req.params.id);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }

    const photo = await storage.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user owns the collection containing this photo
    if (photo.collectionId) {
      const hasAccess = await storage.checkCollectionOwnership(photo.collectionId, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to delete this photo' });
      }
    }

    const success = await storage.deletePhoto(photoId);
    if (success) {
      return res.status(204).end();
    } else {
      return res.status(500).json({ message: 'Failed to delete photo' });
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    return res.status(500).json({ message: 'Failed to delete photo' });
  }
});

// Make photo permanent (convert from temporary)
router.post('/:id/make-permanent', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const photoId = parseInt(req.params.id);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }

    const photo = await storage.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has access to the photo's collection
    const hasAccess = await storage.checkCollectionOwnership(photo.collectionId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this photo' });
    }

    await TemporalStorageService.makePhotoPermanent(photoId);
    return res.json({ message: 'Photo made permanent successfully' });
  } catch (error) {
    console.error('Error making photo permanent:', error);
    return res.status(500).json({ message: 'Failed to make photo permanent' });
  }
});

export { router as photosRouter }; 