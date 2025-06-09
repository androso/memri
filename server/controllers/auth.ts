import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { LoginRequest, loginSchema, SignupRequest, signupSchema } from "@shared/schema";
import { validateSchema } from "../types";
import { databaseSessionStore } from "../databaseSessionStore";
import { TemporalStorageService } from "../models/temporal-storage-service";

// Session configuration
const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes
const SESSION_REFRESH_THRESHOLD = 2 * 60 * 1000; // Refresh if less than 2 minutes remaining

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        displayName: string;
        profilePicture?: string;
      };
      sessionId?: string;
    }
  }
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate session ID
  static generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Create session
  static async createSession(userId: number, username: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    await databaseSessionStore.set(sessionId, {
      userId,
      username,
      expiresAt
    });

    return sessionId;
  }

  // Get session
  static async getSession(sessionId: string) {
    const session = await databaseSessionStore.get(sessionId);
    if (!session) return null;

    // Check if session is expired (already handled in databaseSessionStore.get)
    // Auto-refresh session if it's close to expiring
    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
    console.log(`Session ${sessionId} - Time until expiry: ${Math.round(timeUntilExpiry / 1000)}s`);
    
    if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD) {
      console.log(`Auto-refreshing session ${sessionId} due to proximity to expiry`);
      session.expiresAt = new Date(Date.now() + SESSION_DURATION);
      await databaseSessionStore.set(sessionId, session);
    }

    return session;
  }

  // Delete session
  static async deleteSession(sessionId: string): Promise<void> {
    await databaseSessionStore.delete(sessionId);
  }

  // Clean expired sessions
  static async cleanExpiredSessions(): Promise<void> {
    // First clean expired temporary content
    await TemporalStorageService.cleanExpiredTemporaryContent();
    // Then clean expired sessions
    await databaseSessionStore.cleanExpiredSessions();
  }

  // Login user
  static async login(credentials: LoginRequest): Promise<{ user: any; sessionId: string } | null> {
    try {
      const { storage } = await import("../storage");
      const user = await storage.getUserByUsername(credentials.username);
      if (!user) {
        return null;
      }

      const isValidPassword = await this.verifyPassword(credentials.password, user.password);
      if (!isValidPassword) {
        return null;
      }

      const sessionId = await this.createSession(user.id, user.username);

      // Return user without password
      const { password, createdAt, updatedAt, ...userWithoutPassword } = user;
      // Handle null profilePicture by converting to undefined
      const sanitizedUser = {
        ...userWithoutPassword,
        profilePicture: user.profilePicture ?? undefined
      };
      
      return {
        user: sanitizedUser,
        sessionId
      };
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  }

  // Logout user
  static async logout(sessionId: string): Promise<void> {
    // Clean up temporary content for this session before deleting the session
    await TemporalStorageService.deleteTemporaryContentForSession(sessionId);
    await this.deleteSession(sessionId);
  }

  // Signup user
  static async signup(userData: SignupRequest): Promise<{ user: any; sessionId: string } | null> {
    try {
      const { storage } = await import("../storage");
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        throw new Error("Username already exists");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const newUser = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        displayName: userData.displayName,
        profilePicture: null
      });

      // Create session for the new user
      const sessionId = await this.createSession(newUser.id, newUser.username);

      // Return user without password
      const { password, createdAt, updatedAt, ...userWithoutPassword } = newUser;
      const sanitizedUser = {
        ...userWithoutPassword,
        profilePicture: newUser.profilePicture ?? undefined
      };
      
      return {
        user: sanitizedUser,
        sessionId
      };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }
}

export class AuthController {
  // Login endpoint handler
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const credentials = validateSchema<{ username: string; password: string }>(loginSchema, req.body);
      const result = await AuthService.login(credentials);
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set session cookie
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });
      
      return res.json({ 
        user: result.user, 
        sessionId: result.sessionId,
        sessionExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  }

  // Logout endpoint handler
  static async logout(req: Request, res: Response): Promise<Response> {
    try {
      if (req.sessionId) {
        await AuthService.logout(req.sessionId);
      }
      
      res.clearCookie('sessionId');
      return res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ message: 'Logout failed' });
    }
  }

  // Signup endpoint handler
  static async signup(req: Request, res: Response): Promise<Response> {
    try {
      const userData = validateSchema<SignupRequest>(signupSchema, req.body);
      const result = await AuthService.signup(userData);
      
      if (!result) {
        return res.status(500).json({ message: 'Signup failed' });
      }
      
      // Set session cookie
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });
      
      return res.status(201).json({ user: result.user, sessionId: result.sessionId });
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error instanceof Error && error.message === 'Username already exists') {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Signup failed' 
      });
    }
  }

  // Get current user endpoint handler
  static async getCurrentUser(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.sessionId) {
        return res.status(401).json({ message: 'No active session' });
      }

      // Get session to include expiration time
      const session = await AuthService.getSession(req.sessionId);
      if (!session) {
        return res.status(401).json({ message: 'Invalid or expired session' });
      }

      return res.json({ 
        user: req.user,
        sessionExpiresAt: session.expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({ message: 'Failed to get user information' });
    }
  }

  // Refresh session endpoint handler
  static async refreshSession(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.sessionId || !req.user) {
        return res.status(401).json({ message: 'No active session to refresh' });
      }

      // Extend temporary content expiration for the current session before creating new session
      const newExpirationTime = new Date(Date.now() + 10 * 60 * 1000);
      await TemporalStorageService.extendTemporaryContentExpiration(req.sessionId, newExpirationTime);

      // Delete the old session
      await AuthService.deleteSession(req.sessionId);

      // Create a new session with fresh expiration time
      const newSessionId = await AuthService.createSession(req.user.id, req.user.username);

      // Set new session cookie
      res.cookie('sessionId', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });

      return res.json({ 
        message: 'Session refreshed successfully',
        sessionId: newSessionId,
        user: req.user,
        sessionExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Session refresh error:', error);
      return res.status(500).json({ message: 'Failed to refresh session' });
    }
  }

  // Middleware for requiring authentication
  static async requireAuth(req: any, res: Response, next: NextFunction): Promise<void | Response> {
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;

    if (!sessionId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const session = await AuthService.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ message: 'Invalid or expired session' });
      }

      // Attach session info to request
      req.sessionId = sessionId;
      
      // Get full user info and attach to request
      const { storage } = await import("../storage");
      const user = await storage.getUser(session.userId);
      
      if (user) {
        const { password, createdAt, updatedAt, ...userWithoutPassword } = user;
        // Handle null profilePicture by converting to undefined
        const sanitizedUser = {
          ...userWithoutPassword,
          profilePicture: user.profilePicture ?? undefined
        };
        req.user = sanitizedUser;
        next();
      } else {
        return res.status(401).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ message: 'Authentication error' });
    }
  }

  // Optional authentication middleware (doesn't fail if no auth)
  static async optionalAuth(req: any, res: Response, next: NextFunction): Promise<void> {
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;

    if (!sessionId) {
      return next();
    }

    try {
      const session = await AuthService.getSession(sessionId);
      if (!session) {
        return next();
      }

      req.sessionId = sessionId;
      
      const { storage } = await import("../storage");
      const user = await storage.getUser(session.userId);
      
      if (user) {
        const { password, createdAt, updatedAt, ...userWithoutPassword } = user;
        // Handle null profilePicture by converting to undefined
        const sanitizedUser = {
          ...userWithoutPassword,
          profilePicture: user.profilePicture ?? undefined
        };
        req.user = sanitizedUser;
      }
      next();
    } catch (error) {
      console.error("Optional auth middleware error:", error);
      next();
    }
  }
}

// Clean expired sessions every 5 minutes
setInterval(async () => {
  await AuthService.cleanExpiredSessions();
}, 5 * 60 * 1000); 