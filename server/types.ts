import type { Request } from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Extend Request type to include multer file properties
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[]; };
}

// Helper function to handle zod validation with proper typing
export function validateSchema<T>(schema: any, data: any): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      throw new Error(validationError.message);
    }
    throw error;
  }
}

// Helper function to generate unique filename
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000000000);
  const extension = originalName.split('.').pop();
  return `photo-${timestamp}-${randomNum}.${extension}`;
}

// Helper function to handle database connection issues
export async function withDatabaseRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // If it's a connection timeout, wait before retrying
      if (error instanceof Error && (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNRESET'))) {
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For non-connection errors, don't retry
      throw error;
    }
  }
  
  throw lastError!;
} 