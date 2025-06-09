#!/usr/bin/env python3
"""
Test script for tutorial progress tracking system
Run this after creating the user_progress table in Supabase
"""

import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_progress_system():
    """Test the progress tracking system"""
    try:
        # Import functions from app
        from app import save_user_progress, load_user_progress, get_user_completed_chapters, supabase
        
        if not supabase:
            print("❌ Supabase not configured. Check your environment variables.")
            return False
        
        # Test with a dummy user ID
        test_user_id = str(uuid.uuid4())
        test_course_id = 1
        test_chapter_id = 1
        
        print(f"🧪 Testing with user_id: {test_user_id}")
        print(f"📚 Course ID: {test_course_id}, Chapter ID: {test_chapter_id}")
        
        # Test 1: Save progress
        print("\n1️⃣ Testing save_user_progress...")
        success = save_user_progress(test_user_id, test_course_id, test_chapter_id, test_score=85, practical_passed=True)
        if success:
            print("✅ Progress saved successfully")
        else:
            print("❌ Failed to save progress")
            return False
        
        # Test 2: Load progress
        print("\n2️⃣ Testing load_user_progress...")
        progress = load_user_progress(test_user_id)
        if progress and test_course_id in progress:
            print(f"✅ Progress loaded: {progress}")
        else:
            print(f"❌ Failed to load progress or no data found: {progress}")
            return False
        
        # Test 3: Get completed chapters
        print("\n3️⃣ Testing get_user_completed_chapters...")
        completed = get_user_completed_chapters(test_user_id, test_course_id)
        if test_chapter_id in completed:
            print(f"✅ Completed chapters: {completed}")
        else:
            print(f"❌ Chapter not found in completed list: {completed}")
            return False
        
        # Test 4: Test upsert (update existing progress)
        print("\n4️⃣ Testing progress update (upsert)...")
        success = save_user_progress(test_user_id, test_course_id, test_chapter_id, test_score=95, practical_passed=True)
        if success:
            print("✅ Progress updated successfully")
        else:
            print("❌ Failed to update progress")
            return False
        
        # Test 5: Verify update
        print("\n5️⃣ Verifying update...")
        progress = load_user_progress(test_user_id)
        if progress and test_course_id in progress and test_chapter_id in progress[test_course_id]:
            chapter_progress = progress[test_course_id][test_chapter_id]
            if chapter_progress.get('test_score') == 95:
                print("✅ Progress update verified")
            else:
                print(f"❌ Update not reflected: {chapter_progress}")
                return False
        
        # Cleanup: Remove test data
        print("\n🧹 Cleaning up test data...")
        try:
            supabase.table('user_progress').delete().eq('user_id', test_user_id).execute()
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")
        
        print("\n🎉 All progress tracking tests passed!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you're running this from the correct directory")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_table_exists():
    """Test if the user_progress table exists"""
    try:
        from app import supabase
        
        if not supabase:
            print("❌ Supabase not configured")
            return False
        
        # Try to query the table
        response = supabase.table('user_progress').select('*').limit(1).execute()
        print("✅ user_progress table exists and is accessible")
        return True
        
    except Exception as e:
        print(f"❌ user_progress table not accessible: {e}")
        print("Please run the admin_schema.sql file in Supabase first")
        return False

if __name__ == "__main__":
    print("🔍 Tutorial Progress Tracking Test")
    print("=" * 50)
    
    # First check if table exists
    if test_table_exists():
        # If table exists, run full test suite
        test_progress_system()
    else:
        print("\n📝 To fix this:")
        print("1. Go to your Supabase dashboard")
        print("2. Open the SQL editor")
        print("3. Run the admin_schema.sql file")
        print("4. Then run this test again")