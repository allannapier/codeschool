# Supabase Setup Instructions for Codebotiks

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name (e.g., "codebotiks")
3. Set a database password
4. Choose a region close to your users

## 2. Get Your Project Credentials

From your Supabase dashboard:
1. Go to Settings → API
2. Copy your **Project URL**, **anon/public key**, and **service_role key**
3. Add these to your environment variables (.env file):

```env
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

4. Also update `static/js/auth.js` with your credentials:

```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

**Important**: The service role key is needed for admin operations (course creation/editing)

## 3. Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. First, copy and paste the contents of `database_schema.sql` and run it
3. Then, copy and paste the contents of `admin_schema.sql` and run it
4. This will create all necessary tables for user progress AND course management

## 4. Configure Authentication

### Basic Auth Settings
1. In your Supabase dashboard, go to Authentication → Settings
2. Configure your site URL (e.g., `https://codeschool-lilac.vercel.app` or `http://localhost:5000` for development)
3. Add your redirect URLs for authentication

### Enable Email Confirmations
1. In Authentication → Settings, scroll to "Email Confirmation"
2. **Enable "Enable email confirmations"**
3. Set confirmation URL template (optional): `{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup`

### Configure Email Templates
1. Go to Authentication → Email Templates
2. Configure "Confirm signup" template:
   - **Subject**: `Confirm your Codebotiks account`
   - **Body**: Use a professional template (see example below)

### Example Email Template:
```html
<h2>Welcome to Codebotiks!</h2>
<p>Thanks for signing up! Please confirm your email address to complete your registration.</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email Address</a></p>
<p>If the button doesn't work, copy and paste this link: {{ .ConfirmationURL }}</p>
<p>Best regards,<br>The Codebotiks Team</p>
```

### SMTP Configuration (Required for Email)
1. Go to Settings → Project Settings → SMTP Settings
2. **Option A: Use Supabase SMTP (Recommended)**
   - Enable "Use custom SMTP server"
   - Server: `smtp.gmail.com`
   - Port: `587`
   - Username: Your Gmail address
   - Password: Your Gmail App Password (same as used in .env)
   - Sender email: Your Gmail address
   - Sender name: `Codebotiks`

3. **Option B: Use Default Supabase Email (Limited)**
   - Keep default settings (limited to 3 emails/hour for free tier)

### Test Email Configuration
1. After configuring SMTP, test by creating a new account
2. Check if confirmation email is received
3. Click confirmation link to verify it works

## 5. Set Up Row Level Security (RLS)

The schema includes RLS policies that:
- Only allow users to see their own progress data
- Prevent users from accessing other users' data
- Automatically associate progress with the authenticated user

## 6. Test the Integration

1. Deploy your updated code
2. Try creating a new account
3. Complete a challenge and verify progress is saved
4. Log out and back in to verify progress persists

## 7. Database Tables Created

### `user_progress`
- `id`: Unique identifier
- `user_id`: References the authenticated user
- `challenge_id`: Index of the challenge (0-based)
- `challenge_title`: Human-readable challenge name
- `status`: 'completed', 'attempted', or 'in_progress'
- `completed_at`: Timestamp of completion
- `created_at`/`updated_at`: Record timestamps

### `user_stats` (View)
Provides aggregated statistics:
- Total challenges completed
- First and latest completion dates
- Breakdown by status

## Features Implemented

✅ **User Authentication**
- Email/password signup and login
- Secure session management
- Logout functionality

✅ **Progress Tracking**
- Automatic progress saving on challenge completion
- Visual indicators (✅) for completed challenges
- Real-time progress updates

✅ **Data Security**
- Row Level Security (RLS) enabled
- Users can only access their own data
- Secure authentication with Supabase Auth

✅ **User Experience**
- Persistent login sessions
- Progress visible across sessions
- Completed challenges marked in dropdown

## Next Steps

You can extend this system by:
- Adding user profiles
- Implementing achievement badges
- Creating progress analytics
- Adding social features (leaderboards, etc.)
- Tracking code submissions and feedback history