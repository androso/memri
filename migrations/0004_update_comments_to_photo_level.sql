-- Migration to update comments table from collection-level to photo-level
-- Drop existing comments (if any) since we're changing the structure
DELETE FROM "comments";

-- Drop the old foreign key constraint
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_collection_id_collections_id_fk";

-- Drop the old collection_id column
ALTER TABLE "comments" DROP COLUMN IF EXISTS "collection_id";

-- Add the new photo_id column
ALTER TABLE "comments" ADD COLUMN "photo_id" integer;

-- Add the new foreign key constraint with cascade delete
ALTER TABLE "comments" ADD CONSTRAINT "comments_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action; 