# Ghibli Memories - Photo Album

## Overview

Ghibli Memories is a whimsical photo album web application inspired by Studio Ghibli's magical aesthetic. It allows users to organize photos into collections called "Date Memories," manage photos with comments and likes, and share memories with partners through a partnership system. The application features a carefully crafted design with hand-drawn elements, watercolor textures, and gentle animations that create an enchanting user experience.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Styling**: Tailwind CSS with custom Studio Ghibli-inspired design system
- **UI Components**: Custom components built on Shadcn/UI and Radix UI primitives
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript for full-stack type safety
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Storage**: Firebase Storage for photo uploads and serving
- **Session Management**: Database-backed sessions with 10-minute duration for security
- **Authentication**: bcrypt for password hashing with secure session-based auth

### Data Storage Solutions
- **Primary Database**: PostgreSQL with connection pooling via postgres.js
- **File Storage**: Firebase Storage for scalable image hosting
- **Session Storage**: Database-backed sessions in PostgreSQL sessions table
- **Temporal Storage**: Built-in cleanup system for temporary content linked to sessions

## Key Components

### User Management
- Secure authentication with bcrypt password hashing
- User profiles with display names and profile pictures
- Session-based authentication with automatic cleanup
- Partnership system allowing users to share collections

### Collection System ("Date Memories")
- Collections organized as date memories with metadata
- Support for different collection types (nature, travels, favorites, custom)
- Many-to-many relationship between users and collections via collection_owners table
- Thumbnail generation using first photo in collection

### Photo Management
- Firebase Storage integration for scalable image hosting
- Photo metadata including titles, descriptions, and upload timestamps
- Like functionality for individual photos
- Comment system with threaded discussions on photos
- Image processing with file type validation and size limits

### Partnership Features
- Invitation system with time-limited tokens
- Shared collection access between partners
- Partner discovery and management interface

## Data Flow

### Photo Upload Process
1. Client uploads photo file through multipart form
2. Server validates file type and size constraints
3. File buffer sent to Firebase Storage with generated filename
4. Photo metadata stored in PostgreSQL with Firebase Storage reference
5. Collection ownership verified before photo association
6. Client receives confirmation and UI updates via React Query

### Authentication Flow
1. User submits credentials via login form
2. Server validates against PostgreSQL user records with bcrypt
3. Session created in database with 10-minute expiration
4. Session ID returned as HTTP-only cookie
5. Client automatically includes session cookie in subsequent requests
6. Server middleware validates session on protected routes

### Collection Sharing
1. User creates partnership invitation with generated token
2. Partner accesses invitation URL and accepts partnership
3. Database creates partnership record linking both users
4. Collection ownership automatically extended to partner
5. Both users can access and modify shared collections

## External Dependencies

### Core Framework Dependencies
- React 18 ecosystem with TypeScript support
- Express.js with middleware for file uploads (multer)
- PostgreSQL database with Drizzle ORM
- Firebase Admin SDK for storage operations

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible components
- Custom fonts: Quicksand and Lato for Studio Ghibli aesthetic
- Lucide React for consistent iconography

### Development Tools
- Vite for fast development server and builds
- ESBuild for server-side bundling
- TypeScript compiler with strict configuration
- Drizzle Kit for database migrations

## Deployment Strategy

### Replit Platform Integration
- Configured for Replit's autoscale deployment target
- Multi-module setup: nodejs-20, web, postgresql-16
- Automatic builds using npm run build command
- Port configuration: internal 5000 mapping to external 80

### Database Management
- Drizzle migrations with versioning support
- Automatic user initialization on startup
- Database health checks and connection retry logic
- Session cleanup via background intervals

### File Storage Strategy
- Firebase Storage for production-ready image hosting
- API proxy endpoint for secure image serving
- Automatic file type detection and content-type headers
- CDN-like caching with appropriate headers

### Session and Security
- Database-backed sessions with automatic expiration
- Temporal content cleanup for anonymous users
- CORS configuration for cross-origin requests
- Secure cookie handling with HTTP-only flags

## Changelog

```
Changelog:
- June 15, 2025. Initial setup
- June 15, 2025. Added immutability protection for collections 1, 2, 3, 4, and 6 - these collections cannot be deleted
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```