-- Fix user_progress table by adding missing course_id column
-- Run this in Supabase SQL editor

-- Add the missing course_id column
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE;

-- Add other missing columns if they don't exist
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS test_score INTEGER DEFAULT NULL;

ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS practical_passed BOOLEAN DEFAULT NULL;

-- Update the unique constraint to include course_id
-- First drop the old constraint if it exists
ALTER TABLE user_progress 
DROP CONSTRAINT IF EXISTS user_progress_user_id_chapter_id_key;

-- Add the new unique constraint with course_id
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_user_id_course_id_chapter_id_key 
UNIQUE(user_id, course_id, chapter_id);

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_chapter_id ON user_progress(chapter_id);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
ORDER BY ordinal_position;