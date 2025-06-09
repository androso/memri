import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  authRouter,
  usersRouter,
  imagesRouter,
  collectionsRouter,
  photosRouter,
  commentsRouter,
  partnershipsRouter
} from "./routes/index";

export function registerRoutes(app: Express): Server {
  // Mount all route modules
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/images', imagesRouter);
  app.use('/api/collections', collectionsRouter);
  app.use('/api/photos', photosRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/partnerships', partnershipsRouter);
  
  // Mount photo comments routes (special case)
  app.use('/api/photos', commentsRouter);

  const httpServer = createServer(app);
  return httpServer;
}