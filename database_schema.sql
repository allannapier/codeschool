-- Supabase Database Schema for Codebotiks Progress Tracking

-- Create the user_progress table to track challenge completions
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    challenge_title TEXT NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'attempted', 'in_progress')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per challenge
    UNIQUE(user_id, challenge_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_challenge_id ON user_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed_at ON user_progress(completed_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own progress
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    user_id,
    COUNT(*) as total_challenges_completed,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as challenges_completed,
    COUNT(CASE WHEN status = 'attempted' THEN 1 END) as challenges_attempted,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as challenges_in_progress,
    MIN(completed_at) as first_completion,
    MAX(completed_at) as latest_completion
FROM user_progress 
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON user_stats TO authenticated;

-- Create RLS policy for the view
ALTER VIEW user_stats OWNER TO postgres;

-- Sample data insertion function (for testing)
CREATE OR REPLACE FUNCTION insert_sample_progress(
    p_user_id UUID,
    p_challenge_id TEXT,
    p_challenge_title TEXT,
    p_status TEXT DEFAULT 'completed'
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO user_progress (user_id, challenge_id, challenge_title, status)
    VALUES (p_user_id, p_challenge_id, p_challenge_title, p_status)
    ON CONFLICT (user_id, challenge_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        updated_at = NOW()
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;