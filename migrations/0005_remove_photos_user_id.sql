-- Remove the userId column from photos table since photos belong to collections
-- and collections already have user ownership through collectionOwners table
ALTER TABLE photos DROP COLUMN IF EXISTS user_id; 