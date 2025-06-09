import { Router } from "express";
import { AuthController } from "../controllers/auth";

const router = Router();

// Login endpoint
router.post('/login', AuthController.login);

// Signup endpoint - DISABLED
// router.post('/signup', AuthController.signup);

// Logout endpoint
router.post('/logout', AuthController.requireAuth, AuthController.logout);

// Get current user endpoint
router.get('/me', AuthController.requireAuth, AuthController.getCurrentUser);

export { router as authRouter }; 