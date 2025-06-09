-- Add temporal storage support
-- Add session tracking columns to collections and photos tables

-- Add temporal columns to collections table
ALTER TABLE "collections" ADD COLUMN "is_temporary" boolean DEFAULT false;
ALTER TABLE "collections" ADD COLUMN "session_id" text;
ALTER TABLE "collections" ADD COLUMN "expires_at" timestamp;

-- Add temporal columns to photos table  
ALTER TABLE "photos" ADD COLUMN "is_temporary" boolean DEFAULT false;
ALTER TABLE "photos" ADD COLUMN "session_id" text;
ALTER TABLE "photos" ADD COLUMN "expires_at" timestamp;

-- Add foreign key constraints to sessions table
ALTER TABLE "collections" ADD CONSTRAINT "collections_session_id_sessions_id_fk" 
  FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "photos" ADD CONSTRAINT "photos_session_id_sessions_id_fk" 
  FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;

-- Add indexes for efficient cleanup of temporary content
CREATE INDEX "collections_is_temporary_expires_at_idx" ON "collections" ("is_temporary", "expires_at");
CREATE INDEX "photos_is_temporary_expires_at_idx" ON "photos" ("is_temporary", "expires_at");

-- Add index for session-based queries
CREATE INDEX "collections_session_id_idx" ON "collections" ("session_id");
CREATE INDEX "photos_session_id_idx" ON "photos" ("session_id");
