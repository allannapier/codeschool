-- Complete fix for user_progress table
-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
ORDER BY ordinal_position;

-- Add all missing columns one by one
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS course_id INTEGER;

ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS chapter_id INTEGER;

ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS test_score INTEGER DEFAULT NULL;

ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS practical_passed BOOLEAN DEFAULT NULL;

ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop existing constraints if they exist (ignore errors if they don't exist)
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS fk_user_progress_course;
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS fk_user_progress_chapter;
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_course_id_chapter_id_key;

-- Add the foreign key constraints
ALTER TABLE user_progress 
ADD CONSTRAINT fk_user_progress_course 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE user_progress 
ADD CONSTRAINT fk_user_progress_chapter 
FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE;

-- Add the unique constraint
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_user_id_course_id_chapter_id_key 
UNIQUE(user_id, course_id, chapter_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_chapter_id ON user_progress(chapter_id);

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
ORDER BY ordinal_position;