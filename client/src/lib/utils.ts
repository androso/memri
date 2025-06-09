import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_ENDPOINTS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a stored image filename/path to the proper API URL
 * @param filePath - The filename or path stored in the database
 * @returns The full API URL to serve the image
 */
export function getImageUrl(filePath: string | null | undefined): string | undefined {
  if (!filePath) return undefined;
  
  // Extract filename from path if it's a full path
  const fileName = filePath.includes('/') ? filePath.split('/').pop() : filePath;
  
  if (!fileName) return undefined;
  
  return API_ENDPOINTS.image(fileName);
}
