import { Router, type Request, type Response } from "express";
import { AuthController } from "../controllers/auth";
import { DemoCleanupService } from "../models/demo-cleanup-service";

const router = Router();

// Manual cleanup endpoint for demo user content
router.post('/cleanup', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Only allow demo user to trigger their own cleanup, or admin users
    if (req.user.username !== 'demo') {
      return res.status(403).json({ message: 'Only demo user can trigger cleanup' });
    }

    console.log(`Manual demo cleanup triggered by user: ${req.user.username}`);
    
    // Get summary before cleanup
    const beforeSummary = await DemoCleanupService.getDemoUserContentSummary();
    
    // Perform cleanup
    await DemoCleanupService.cleanupDemoUserContent();
    
    // Get summary after cleanup
    const afterSummary = await DemoCleanupService.getDemoUserContentSummary();
    
    return res.json({
      message: 'Demo user cleanup completed successfully',
      before: beforeSummary,
      after: afterSummary
    });
  } catch (error) {
    console.error('Error during manual demo cleanup:', error);
    return res.status(500).json({ message: 'Failed to cleanup demo user content' });
  }
});

// Get demo user content summary
router.get('/summary', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Only allow demo user to view their summary
    if (req.user.username !== 'demo') {
      return res.status(403).json({ message: 'Only demo user can view their content summary' });
    }

    const summary = await DemoCleanupService.getDemoUserContentSummary();
    
    return res.json({
      summary,
      protectedCollections: [1, 2, 3, 4, 6]
    });
  } catch (error) {
    console.error('Error getting demo user content summary:', error);
    return res.status(500).json({ message: 'Failed to get content summary' });
  }
});

export { router as demoCleanupRouter };