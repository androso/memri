import { Router, type Request, type Response } from "express";
import { DemoUserService } from "../models/demo-user-service";

const router = Router();

// Create a new temporary demo user
router.post('/create', async (req: Request, res: Response) => {
  try {
    console.log('Creating new temporary demo user...');
    
    const { user, sessionId } = await DemoUserService.createTemporaryDemoUser();
    
    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000 // 10 minutes
    });

    return res.status(201).json({
      message: 'Temporary demo user created successfully',
      user,
      sessionId
    });
  } catch (error) {
    console.error('Error creating temporary demo user:', error);
    return res.status(500).json({ 
      message: 'Failed to create temporary demo user' 
    });
  }
});

// Get summary of all temporary demo users (for monitoring)
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = await DemoUserService.getTemporaryDemoUsersSummary();
    return res.json(summary);
  } catch (error) {
    console.error('Error getting demo users summary:', error);
    return res.status(500).json({ 
      message: 'Failed to get demo users summary' 
    });
  }
});

// Manual cleanup of expired demo users
router.post('/cleanup-expired', async (req: Request, res: Response) => {
  try {
    console.log('Manual cleanup of expired demo users triggered');
    await DemoUserService.cleanupExpiredDemoUsers();
    
    return res.json({
      message: 'Expired demo users cleanup completed'
    });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    return res.status(500).json({ 
      message: 'Failed to cleanup expired demo users' 
    });
  }
});

export { router as demoUsersRouter };