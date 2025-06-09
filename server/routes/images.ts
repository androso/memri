import { Router, type Request, type Response } from "express";
import { getFirebaseStorage } from "../firebase";

const router = Router();

// Serve images from Firebase Storage
router.get('/:fileName', async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    
    // Get Firebase Storage instance
    const firebaseStorage = getFirebaseStorage();
    const bucket = firebaseStorage.bucket();
    const file = bucket.file(`uploads/${fileName}`);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Get file metadata to set proper content type
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'application/octet-stream';
    
    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });
    
    // Create read stream and pipe to response
    const stream = file.createReadStream();
    stream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error serving image' });
      }
    });
    
    stream.pipe(res);
  } catch (error) {
    console.error('Error serving image:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error serving image' });
    }
  }
});

export { router as imagesRouter }; 