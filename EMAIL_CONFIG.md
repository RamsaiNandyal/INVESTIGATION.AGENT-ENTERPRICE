# Email Configuration Guide for INVESTIGATE.AGENT

## Quick Setup (Gmail - Free)

### Step 1: Enable Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" (if not already enabled)
3. Go to "App passwords" 
4. Select "Mail" and "Windows Computer"
5. Google will generate a 16-character password - copy it

### Step 2: Create .env File
1. Copy `.env.example` to `.env`
2. Add your Gmail credentials:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

### Step 3: Install and Run
```bash
# Install server dependencies
npm install

# Start the email server (in background or new terminal)
npm run server

# In another terminal, start the app
npm run dev

# Or run both together (requires concurrently installed)
npm run dev-all
```

## Verify It's Working
1. Open http://localhost:5173 (or your Vite port)
2. Signup with your email
3. Check your inbox - you should receive a welcome email
4. Check the terminal running `npm run server` - you should see confirmation logs

## Using Different Email Services

### SendGrid (Recommended for production)
```javascript
// Replace transporter config in server.js:
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Mailgun
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_SMTP_USER,
    pass: process.env.MAILGUN_SMTP_PASS
  }
});
```

### AWS SES
```javascript
const nodemailer = require('nodemailer');
const aws = require('@aws-sdk/client-ses');

const transporter = nodemailer.createTransport({
  SES: new aws.SES({
    region: process.env.AWS_REGION
  })
});
```

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using an **App Password**, not your Gmail password
- The app password should be 16 characters without spaces
- Check that 2-Step Verification is enabled

### "SMTP connection timeout"
- Check your internet connection
- Make sure Gmail allows SMTP access
- Try waiting a few minutes after creating the app password

### Emails not arriving
- Check spam/junk folder
- Verify the email address is correct
- Check server.js console for error messages

### Server won't start
- Make sure port 3001 is not in use: `netstat -ano | findstr :3001` (Windows)
- Kill the process using that port or change `PORT` in `.env`

## Testing Without Email (Development)

The server has a fallback mode - if email credentials aren't configured, it will:
1. Log emails to the console
2. Still return success response to frontend
3. Allow you to develop without real email setup

Just start the server without a `.env` file and emails will print to console.

## Files Created

- `server.js` - Email server with Nodemailer
- `.env.example` - Configuration template
- `EMAIL_CONFIG.md` - This guide

## Security Notes

⚠️ **Never commit `.env` to version control**
- `.env` contains your email credentials
- Add `.env` to `.gitignore` if using Git
- Only share `.env.example` (without credentials)

## Next Steps

1. Configure your email credentials in `.env`
2. Run `npm install` to install server dependencies
3. Run `npm run server` in one terminal
4. Run `npm run dev` in another terminal
5. Test signup/forgot password flow
6. Check your email inbox for messages
