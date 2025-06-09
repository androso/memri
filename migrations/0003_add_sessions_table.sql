-- Create sessions table for database-based session storage
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"username" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Add index on expires_at for efficient cleanup of expired sessions
CREATE INDEX "sessions_expires_at_idx" ON "sessions" ("expires_at");

-- Add index on user_id for efficient user session lookups
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id"); 