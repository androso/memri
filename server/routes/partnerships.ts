import { Router, type Request, type Response } from "express";
import { AuthController } from "../controllers/auth";
import { storage } from "../storage";

const router = Router();

// Get current user's partner
router.get('/partner', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const partner = await storage.getUserPartner(req.user.id);
    return res.json({ partner });
  } catch (error) {
    console.error('Error fetching partner:', error);
    return res.status(500).json({ message: 'Failed to fetch partner' });
  }
});

// Get pending invitations sent by current user
router.get('/invitations', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const invitations = await storage.getUserPendingInvitations(req.user.id);
    return res.json({ invitations });
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return res.status(500).json({ message: 'Failed to fetch pending invitations' });
  }
});

// Create partnership invitation
router.post('/invite', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const inviteToken = await storage.createPartnershipInvitation(req.user.id);
    const inviteUrl = `${req.protocol}://${req.get('host')}/partnership/invite/${inviteToken}`;
    
    return res.json({ 
      inviteToken,
      inviteUrl,
      message: 'Partnership invitation created successfully' 
    });
  } catch (error) {
    console.error('Error creating partnership invitation:', error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to create partnership invitation' });
  }
});

// Get invitation details by token
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const invitation = await storage.getInvitationByToken(token);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        message: `Invitation is ${invitation.status}`,
        status: invitation.status
      });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ 
        message: 'Invitation has expired',
        status: 'expired'
      });
    }

    return res.json({
      invitation: {
        id: invitation.id,
        fromUser: {
          id: invitation.fromUser.id,
          username: invitation.fromUser.username,
          displayName: invitation.fromUser.displayName,
          profilePicture: invitation.fromUser.profilePicture,
        },
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      }
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return res.status(500).json({ message: 'Failed to fetch invitation' });
  }
});

// Accept partnership invitation
router.post('/invite/:token/accept', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { token } = req.params;
    await storage.acceptPartnershipInvitation(token, req.user.id);
    
    return res.json({ message: 'Partnership invitation accepted successfully' });
  } catch (error) {
    console.error('Error accepting partnership invitation:', error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to accept partnership invitation' });
  }
});

// Reject partnership invitation
router.post('/invite/:token/reject', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    await storage.rejectPartnershipInvitation(token);
    
    return res.json({ message: 'Partnership invitation rejected' });
  } catch (error) {
    console.error('Error rejecting partnership invitation:', error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to reject partnership invitation' });
  }
});

// Remove partnership
router.delete('/partnership', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    await storage.removePartnership(req.user.id);
    return res.json({ message: 'Partnership removed successfully' });
  } catch (error) {
    console.error('Error removing partnership:', error);
    return res.status(500).json({ message: 'Failed to remove partnership' });
  }
});

// Cancel pending invitation
router.delete('/invite/:token', AuthController.requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { token } = req.params;
    await storage.cancelPartnershipInvitation(token, req.user.id);
    
    return res.json({ message: 'Partnership invitation cancelled' });
  } catch (error) {
    console.error('Error cancelling partnership invitation:', error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to cancel partnership invitation' });
  }
});

export default router; 