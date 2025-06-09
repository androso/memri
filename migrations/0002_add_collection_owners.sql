-- Create collection_owners table for many-to-many relationship
CREATE TABLE "collection_owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "collection_owners" ADD CONSTRAINT "collection_owners_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "collection_owners" ADD CONSTRAINT "collection_owners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Add unique constraint to prevent duplicate ownership records
ALTER TABLE "collection_owners" ADD CONSTRAINT "collection_owners_collection_user_unique" UNIQUE("collection_id", "user_id");

-- Migrate existing data: for each collection, create ownership records for both users
INSERT INTO "collection_owners" ("collection_id", "user_id")
SELECT c.id, u.id
FROM "collections" c
CROSS JOIN "users" u
WHERE c.id IS NOT NULL;

-- Note: We're keeping the original userId column for now for backward compatibility
-- but the new collection_owners table will be the source of truth 