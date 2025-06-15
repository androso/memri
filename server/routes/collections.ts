import { Router, type Request, type Response } from "express";
import { insertCollectionSchema } from "@shared/schema";
import { AuthController } from "../controllers/auth";
import { storage } from "../storage";
import { upload } from "../multer";
import { validateSchema, generateFileName, withDatabaseRetry, type MulterRequest } from "../types";
import { TemporalStorageService } from "../models/temporal-storage-service";

const router = Router();

// Get all collections
router.get('/', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const collections = await storage.getCollections(req.user.id);
    return res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return res.status(500).json({ message: 'Failed to fetch collections' });
  }
});

// Get collections with thumbnails
router.get('/with-thumbnails', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const collections = await storage.getCollectionsWithThumbnails(req.user.id);
    return res.json(collections);
  } catch (error) {
    console.error('Error fetching collections with thumbnails:', error);
    return res.status(500).json({ message: 'Failed to fetch collections with thumbnails' });
  }
});

// Create collection
router.post('/', AuthController.requireAuth, upload.array('photo'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    console.log(`Creating collection for user ${req.user.username} (${req.user.id})`);
    
    // Parse form data from req.body
    const { name, description, type, isTemporary } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    // Parse temporal storage parameters
    const makeTemporary = isTemporary === 'true' || isTemporary === true;
    const sessionId = makeTemporary ? req.sessionId : null;
    const expiresAt = makeTemporary && sessionId ? new Date(Date.now() + 10 * 60 * 1000) : null;
    
    // Create collection with retry logic
    const data = validateSchema<{
      name: string;
      description?: string | null;
      type?: "custom" | "nature" | "travels" | "favorites";
      userId?: number | null;
      isTemporary?: boolean;
      sessionId?: string | null;
      expiresAt?: Date | null;
    }>(insertCollectionSchema, {
      name,
      description,
      type: type || 'custom',
      userId: req.user.id,
      isTemporary: makeTemporary,
      sessionId,
      expiresAt
    });
    
    const collection = await withDatabaseRetry(() => storage.createCollection(data));
    console.log(`Collection created successfully: ${collection.id}`);
    
    // Handle photo uploads if any
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log(`Processing ${req.files.length} photo uploads`);
      const photoTitles = Array.isArray(req.body.photoTitle) 
        ? req.body.photoTitle 
        : [req.body.photoTitle];
        
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const title = photoTitles[i] || file.originalname;
        
        console.log(`Processing photo ${i + 1}/${req.files.length}: ${title}`);
        
        // Generate unique filename and save to Firebase Storage
        const fileName = generateFileName(file.originalname);
        const filePath = await storage.savePhotoToFirebaseStorage(file.buffer, fileName);
        
        // Save photo to collection with retry logic
        await withDatabaseRetry(() => storage.createPhoto({
          title,
          fileName: fileName,
          fileType: file.mimetype,
          filePath: filePath,
          collectionId: collection.id,
          isLiked: false,
          isTemporary: makeTemporary,
          sessionId,
          expiresAt
        }));
        
        console.log(`Photo ${i + 1} saved successfully`);
      }
    }
    
    return res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    
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
      message: error instanceof Error ? error.message : 'Failed to create collection',
      code: 'CREATION_FAILED'
    });
  }
});

// Get single collection
router.get('/:id', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ message: 'Invalid collection ID' });
    }

    const collection = await storage.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user is an owner of this collection
    const ownership = await storage.checkCollectionOwnership(collectionId, req.user.id);
    if (!ownership) {
      return res.status(403).json({ message: 'Not authorized to access this collection' });
    }

    return res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return res.status(500).json({ message: 'Failed to fetch collection' });
  }
});

// Update collection
router.put('/:id', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ message: 'Invalid collection ID' });
    }

    const collection = await storage.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user is an owner of this collection
    const ownership = await storage.checkCollectionOwnership(collectionId, req.user.id);
    if (!ownership) {
      return res.status(403).json({ message: 'Not authorized to update this collection' });
    }

    const data = validateSchema<Partial<{
      name: string;
      description?: string | null;
      type?: "custom" | "nature" | "travels" | "favorites";
      userId?: number | null;
    }>>(insertCollectionSchema.partial(), req.body);
    const updatedCollection = await storage.updateCollection(collectionId, data);
    return res.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection:', error);
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update collection' });
  }
});

// Delete collection
router.delete('/:id', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ message: 'Invalid collection ID' });
    }

    const collection = await storage.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user is an owner of this collection
    const ownership = await storage.checkCollectionOwnership(collectionId, req.user.id);
    if (!ownership) {
      return res.status(403).json({ message: 'Not authorized to delete this collection' });
    }

    const success = await storage.deleteCollection(collectionId);
    if (success) {
      return res.status(204).end();
    } else {
      return res.status(500).json({ message: 'Failed to delete collection' });
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    
    // Check if it's a protected collection error
    if (error instanceof Error && error.message.includes('is protected and cannot be deleted')) {
      return res.status(403).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Failed to delete collection' });
  }
});

// Make collection permanent (convert from temporary)
router.post('/:id/make-permanent', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ message: 'Invalid collection ID' });
    }

    // Check if user is an owner of this collection
    const ownership = await storage.checkCollectionOwnership(collectionId, req.user.id);
    if (!ownership) {
      return res.status(403).json({ message: 'Not authorized to modify this collection' });
    }

    await TemporalStorageService.makeCollectionPermanent(collectionId);
    return res.json({ message: 'Collection made permanent successfully' });
  } catch (error) {
    console.error('Error making collection permanent:', error);
    return res.status(500).json({ message: 'Failed to make collection permanent' });
  }
});

// Get temporary content for current session
router.get('/temporary/session', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.sessionId) {
      return res.status(401).json({ message: 'User not authenticated or no active session' });
    }

    const temporaryContent = await TemporalStorageService.getTemporaryContentBySession(req.sessionId);
    return res.json(temporaryContent);
  } catch (error) {
    console.error('Error fetching temporary content:', error);
    return res.status(500).json({ message: 'Failed to fetch temporary content' });
  }
});

export { router as collectionsRouter }; 