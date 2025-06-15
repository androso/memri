import { Router, type Response } from "express";
import { updateUserSchema } from "@shared/schema";
import { AuthService, AuthController } from "../controllers/auth";
import { storage } from "../storage";
import { upload } from "../multer";
import { validateSchema, generateFileName, type MulterRequest } from "../types";

const router = Router();

// Get all users
router.get('/', AuthController.requireAuth, async (req, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user profile
router.put('/profile', AuthController.requireAuth, upload.single('profilePicture'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const updateData: any = {};
    
    // Handle text fields
    if (req.body.displayName) {
      updateData.displayName = req.body.displayName;
    }
    
    // Prevent password changes for demo user
    if (req.body.password && req.user.username !== 'demo') {
      updateData.password = await AuthService.hashPassword(req.body.password);
    }
    
    // Handle profile picture upload
    if (req.file) {
      const fileName = generateFileName(req.file.originalname);
      const filePath = await storage.savePhotoToFirebaseStorage(req.file.buffer, fileName);
      updateData.profilePicture = filePath;
    }
    
    const validatedData = validateSchema<{
      password?: string;
      displayName?: string;
      profilePicture?: string | null;
    }>(updateUserSchema, updateData);
    const updatedUser = await storage.updateUser(req.user.id, validatedData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update profile' });
  }
});

// Get user profiles for login page
router.get('/profiles', async (req, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    const profiles = users.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      profilePicture: user.profilePicture
    }));
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    res.status(500).json({ message: 'Failed to fetch user profiles' });
  }
});

export { router as usersRouter }; 