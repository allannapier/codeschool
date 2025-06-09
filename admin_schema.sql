-- Extended Supabase Database Schema for Course Management
-- Run this in addition to the existing database_schema.sql

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    description TEXT NOT NULL,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER DEFAULT 8,
    thumbnail TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    prerequisites TEXT,
    chapter_count INTEGER DEFAULT 0,
    created_date DATE DEFAULT CURRENT_DATE,
    updated_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    estimated_duration INTEGER DEFAULT 45,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    learning_objectives TEXT[] DEFAULT '{}',
    content TEXT DEFAULT '',
    has_test BOOLEAN DEFAULT false,
    has_practical BOOLEAN DEFAULT false,
    test_questions JSONB DEFAULT '[]',
    practical_instructions TEXT DEFAULT '',
    practical_starter_code TEXT DEFAULT '',
    practical_evaluation_criteria TEXT DEFAULT '',
    created_date DATE DEFAULT CURRENT_DATE,
    updated_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique chapter numbers per course
    UNIQUE(course_id, chapter_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(featured);

CREATE INDEX IF NOT EXISTS idx_chapters_course_id ON chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(course_id, chapter_number);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_date = CURRENT_DATE;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
    BEFORE UPDATE ON chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update chapter count when chapters are added/removed
CREATE OR REPLACE FUNCTION update_course_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update chapter count for the affected course
    UPDATE courses 
    SET chapter_count = (
        SELECT COUNT(*) 
        FROM chapters 
        WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to update chapter count
CREATE TRIGGER update_chapter_count_on_insert
    AFTER INSERT ON chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_course_chapter_count();

CREATE TRIGGER update_chapter_count_on_delete
    AFTER DELETE ON chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_course_chapter_count();

-- Enable Row Level Security (RLS) for admin-only access
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access, admin write access
-- Anyone can read published courses
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (status = 'published');

-- Anyone can read chapters of published courses
CREATE POLICY "Anyone can view chapters of published courses" ON chapters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = chapters.course_id 
            AND courses.status = 'published'
        )
    );

-- For admin access, we'll handle this in the Python code with service role key

-- Create user progress table for tracking chapter completions
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- Supabase user UUID
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    test_score INTEGER DEFAULT NULL, -- Percentage score on test (if applicable)
    practical_passed BOOLEAN DEFAULT NULL, -- Whether practical exercise was passed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can only complete each chapter once
    UNIQUE(user_id, course_id, chapter_id)
);

-- Create indexes for user progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_chapter_id ON user_progress(chapter_id);

-- Enable RLS for user progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress  
CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample courses for development
INSERT INTO courses (title, slug, subtitle, description, difficulty, estimated_duration, status, featured) VALUES
('Python Fundamentals', 'python-fundamentals', 'Learn the basics of Python programming', 'Master Python fundamentals including variables, functions, loops, and data structures. Perfect for beginners starting their programming journey.', 'beginner', 8, 'published', true),
('Web Development with JavaScript', 'javascript-web-dev', 'Build interactive websites', 'Learn modern JavaScript, DOM manipulation, and web APIs to create dynamic and interactive web applications.', 'intermediate', 12, 'published', false)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample chapters
INSERT INTO chapters (course_id, title, chapter_number, estimated_duration, difficulty, learning_objectives, has_test, has_practical, practical_instructions) VALUES
(1, 'Introduction to Python', 1, 45, 'beginner', '{"Understand what Python is and why it''s useful", "Set up your Python development environment", "Write and run your first Python program"}', true, true, 'Write a simple Python program that prints a personalized greeting message.'),
(1, 'Variables and Data Types', 2, 60, 'beginner', '{"Learn about different data types in Python", "Understand how to create and use variables", "Practice with strings, numbers, and booleans"}', true, true, 'Create a program that stores information about a person and displays it in a formatted way.'),
(2, 'JavaScript Basics', 1, 50, 'intermediate', '{"Understand JavaScript syntax and structure", "Learn about variables and data types", "Write basic JavaScript functions"}', true, true, 'Create an interactive webpage that responds to user clicks.')
ON CONFLICT (course_id, chapter_number) DO NOTHING;