# Email Setup Troubleshooting Guide

## Error: "Username and Password not accepted" (Gmail)

This error means Gmail is rejecting your credentials. Here's how to fix it:

### Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click "2-Step Verification" 
3. Follow the setup process
4. **This is required for App Passwords**

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" from the dropdown
3. Click "Generate"
4. Copy the 16-character password (no spaces)
5. Use this as your `SMTP_PASSWORD` in .env file

### Step 3: Update .env File
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-actual-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

### Step 4: Test Configuration
Visit `http://localhost:5000/api/test-email` to test

## Alternative: Use Different Email Provider

If Gmail continues to be problematic, try Outlook:

```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your_email@outlook.com
SMTP_PASSWORD=your_outlook_password
```

## Common Issues:

1. **Using regular Gmail password instead of App Password**
   - Solution: Generate App Password as described above

2. **2-Step Verification not enabled**
   - Solution: Enable it first, then generate App Password

3. **Wrong email format**
   - Solution: Use full email address (user@gmail.com)

4. **App Password has spaces**
   - Solution: Remove all spaces from the 16-character password

5. **Account locked/suspicious activity**
   - Visit [Gmail Unlock](https://accounts.google.com/DisplayUnlockCaptcha)
   - Sign in and click "Continue"

## Debug Steps:

1. Check configuration: `http://localhost:5000/api/debug-config`
2. Test email sending: `http://localhost:5000/api/test-email`
3. Check server console for detailed error messages
4. Verify .env file exists and has correct values

## Alternative Email Services:

If Gmail doesn't work, try:
- **Outlook/Hotmail**: Usually works with regular password
- **Yahoo**: Requires App Password like Gmail
- **SendGrid**: Professional email service (requires API key)
- **Mailgun**: Another professional option