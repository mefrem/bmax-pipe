# Feedback System Setup

## What's Included

✅ **Floating feedback button** on all authenticated pages (bottom-right corner)
✅ **Modal form** with:
- Text area for messages
- Optional screenshot upload (max 5MB)
- Captures current page URL automatically

✅ **Database storage** in Neon (`feedback` table)
✅ **Admin dashboard** shows recent feedback with screenshots
✅ **Optional email notifications** via Resend

## How It Works

1. User clicks floating feedback button
2. Writes message and optionally attaches screenshot
3. Feedback saved to database
4. (Optional) Email sent to your inbox
5. View all feedback in admin dashboard at `/admin`

## Email Notifications Setup (Optional)

The feedback system works without email, but if you want notifications:

### 1. Sign up for Resend

- Go to: https://resend.com/signup
- Free tier: 100 emails/day, 3,000/month

### 2. Verify Your Domain (or use resend.dev)

**Option A: Use resend.dev (Quick, for testing)**
- No setup needed
- From address will be: `feedback@resend.dev`
- Works immediately

**Option B: Use your own domain (Recommended)**
- Add your domain in Resend dashboard
- Add DNS records they provide
- Verify domain
- Update `from:` address in `app/api/feedback/route.ts`

### 3. Get API Key

- In Resend dashboard, go to API Keys
- Create new key
- Copy the key (starts with `re_`)

### 4. Add to Environment Variables

**Local:**
```bash
# Add to .env.local
RESEND_API_KEY=re_your_key_here
```

**Vercel:**
```bash
npx vercel env add RESEND_API_KEY production
# Paste your key when prompted

# Or add manually in dashboard:
# https://vercel.com/mefrem/bmax-pipe/settings/environment-variables
```

### 5. Redeploy (if on Vercel)

```bash
npx vercel --prod
# Or just push to GitHub - auto-deploys
```

## What Gets Saved

Each feedback submission saves:
- `id`: Unique identifier
- `user_id`: User's ID (if logged in)
- `user_email`: User's email (if logged in)
- `message`: The feedback text
- `screenshot_url`: URL to uploaded screenshot (if provided)
- `user_agent`: Browser/device info
- `page_url`: Which page they were on
- `created_at`: Timestamp

## Viewing Feedback

### In Admin Dashboard
- Go to: `https://your-app.vercel.app/admin`
- Or locally: `http://localhost:3000/admin`
- Scroll to "Recent Feedback" section
- Click screenshot links to view images

### In Database
Query directly in Neon:
```sql
SELECT * FROM feedback ORDER BY created_at DESC LIMIT 10;
```

### Via Email (if configured)
You'll receive an email for each submission with:
- User email
- Page they were on
- Feedback message
- Screenshot link (if provided)
- User agent info

## Customization

### Change Email Recipient

Edit `app/api/feedback/route.ts`:
```typescript
to: "your-email@example.com",  // Change this
```

### Change Button Position

Edit `components/feedback-widget.tsx`:
```typescript
className="fixed bottom-6 right-6 ..."  // Change positioning
```

### Change Button Style

Edit the button classes in `components/feedback-widget.tsx`

### Disable on Certain Pages

Remove `<FeedbackWidget />` from specific layouts or add conditional logic

## Troubleshooting

**Button not showing?**
- Check if you're on an authenticated page
- Widget only appears in `app/(app)/layout.tsx` (logged-in users)

**Email not sending?**
- Check `RESEND_API_KEY` is set correctly
- Check Resend dashboard for logs
- Emails still get saved to database even if email fails

**Screenshot upload fails?**
- Check file is under 5MB
- Check `BLOB_READ_WRITE_TOKEN` is set in environment

**Database error?**
- Table is created automatically on first feedback submission
- Check Neon connection string is correct

