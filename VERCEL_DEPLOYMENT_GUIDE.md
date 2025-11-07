# Vercel Deployment Guide - Personal Digital Diary

Complete guide to deploy your Personal Digital Diary app to Vercel and make it live.

---

## Prerequisites

- ✅ GitHub account with your code pushed
- ✅ Vercel account (free tier works fine)
- ✅ Supabase database running
- ✅ Google Drive API credentials

---

## Step 1: Prepare Your Repository

### 1.1 Push Latest Changes to GitHub

```bash
git add .
git commit -m "Ready for production deployment"
git push
```

### 1.2 Verify Your .gitignore

Make sure these are in your `.gitignore`:
```
.env
.env.local
node_modules/
.next/
```

**Important:** Never commit your `.env` file to GitHub!

---

## Step 2: Set Up Vercel

### 2.1 Create Vercel Account

1. Go to https://vercel.com
2. Sign up with your GitHub account
3. Authorize Vercel to access your repositories

### 2.2 Import Your Project

1. Click **"Add New Project"**
2. Select **"Import Git Repository"**
3. Find your **"Gallery"** repository
4. Click **"Import"**

---

## Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Database Variables
```
DATABASE_URL=postgresql://postgres.ykexfunisavmzmprwlbj:jE59xf3ewTMsCORX@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.ykexfunisavmzmprwlbj:jE59xf3ewTMsCORX@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

### Supabase Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://ykexfunisavmzmprwlbj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZXhmdW5pc2F2bXptcHJ3bGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODAwMzYsImV4cCI6MjA3NzA1NjAzNn0.-tr1bdjQb5sRFoCYjNHaGHDYtwDOxzmslCSNE9SeOyg
```

### Authentication Variable
```
SESSION_SECRET=03df54b0b8cdb05b14bdfb75b18609ca89f3df0320985da126477f000b113a31
```

### Google Drive API Variables
```
GOOGLE_CLIENT_EMAIL=keegan-driveapi@mythical-sweep-476412-u5.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCnc8/sk+qddqsa
6314kEud4lgNIG/VPPRaKzHsV/fqRZM1zHGlrbCwNsKu+1r1Ycf/Is0lbj4ZLQdJ
WMjyDIfyFMDg6UmRjbJty7CMrMf7qco89dtGFud7YyFkch960kdkQcW0MoJ8DOkp
wN7TEd2HBjAEQ74c8Xnxq22I+Ut5LOl/p12T+dBeVCVBz9SKfR4gIqJtEVt8h0kQ
tg2CZ8/N8uD8GRiw3HUVc6A/AheeEVakaQoYmNCglTBz0hYGcU9tAOUX9xCfXOVe
WYagbBNWvVo+Ro1jbRz97LA8AwCrMr6BGFjMQD3+IHSAzRFlkbUSCRlRIJXpKfyh
E5tSoHO5AgMBAAECggEAAi9BnC2F1w4QR2ahGWyQf/vO+ETfEKId8fs0SIgRRO4p
cH89UFMGxhXAznWbBy6CZHK4yG86witTOAK/hGDjeSYKKiUA/7Qgiswofn1WkpLx
f4AZnz13QaXWbrAKdxi9M7Kj+KjcCPBGLnREs+48vKE5CSU1Gr2PwLZi1HGkKW2G
H8bB8HiLbWzEbf5GxwXIiI/eL+DXlIUNHdTlUoTEiH/vzfbScpvqREKOXs3b3b1z
qYBCn6+UjChunQ2LCWpCyo8cexwf/gA2Wl1rLYKwg8l6p4No1IBK9tXnxeF9uEba
ann0THXN2tjHZvZXN2SxGt1kYOT3WmdtuX1XEeXEgQKBgQDrlrEZTi34yP7O/Bse
0c9f/QZkEORZICfZcLk4CIAt+We2EvtSKvEFzgmueqESY3AHKyqIwHviM5TBdQug
HX609Vd95yrbQI/t5s/PWxWUNbWAk4txxQmRU1wHOA2sM1dyUTmvLDIOTrvFhhKa
TLu7zsLHGAVRFKdPObJ3Ano8yQKBgQC19d9L/TFf042rrWQ8XmMFmA++SU3OwMmJ
tYq16dvwfxHQN6zFy5Mk+LiAevQhyycHVCPR5ywhtETEyDwamdAb3mPtQy4WMYcY
1CAoxTpYD/dAEbXqPfC673g5snA1sqt7sgEpppydE4Hzn3vVfhDPLZFmzAQjyJlk
+Ebs2aEncQKBgQDVGZUOj9IztRQQBKk/godzizuJrmHvYI/LNxTDY6UWcQBoCNl+
pMsp9gp54gDq0jmWsmwiEQK+ROws5gPjDGr9ouNGRqFUfBz1FBArv3dQfhi0ukGr
YpDZ/K5E9WYgurxB8skb8/0/RebBsBoJqpkyM7+qOcctZWJF3qnYzsvlSQKBgCFN
tif3WIEcfFKOssjl0aPleAQw8H/GA10kEBZJjkrPRxhgCExPfUgICeTiHCrPPv51
ZPT3Jbmpf+iwaWfI/TEMnCeB4z6GpB5kPNqZdptFmNBuLWiJG7VrPQr6YNVDNWW3
Z8USzJlnR6KqbwTdRQBWa8Vv09Yk0gaL9pdFIdzRAoGAE0jkZBmKAnxlHErKXZLX
L8XvAIEOY2NtOGcheTicCYC252GIu1B2QMaIA1yKNJ5D860E3UTLCL20D2lkfvtY
2b3DuwggCIjR+Jn6wWD/SZD7RWOVV7zwFgo/PFcqxkz4wstcrfWUoaDoBr5bg6aa
wTrH3qj0rkTs69JAqpRdHUY=
-----END PRIVATE KEY-----
GOOGLE_PROJECT_ID=mythical-sweep-476412-u5
```

**Important Notes:**
- Copy the GOOGLE_PRIVATE_KEY exactly as shown (including line breaks)
- Make sure there are no extra spaces or quotes
- All variables are case-sensitive

---

## Step 4: Configure Build Settings

### 4.1 Framework Preset
- **Framework:** Next.js
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### 4.2 Node.js Version
- Set to **Node.js 18.x** or higher

---

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Vercel will show you the deployment URL

---

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Add Your Domain

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `mydiary.com`)
4. Follow Vercel's DNS configuration instructions

### 6.2 Configure DNS

Add these records to your domain provider:

**For root domain (mydiary.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Step 7: Verify Deployment

### 7.1 Test Your Live Site

1. Visit your Vercel URL (e.g., `your-app.vercel.app`)
2. Test login functionality
3. Add a folder
4. Upload a cover image
5. View photos in a folder

### 7.2 Check Database Connection

- Make sure your Supabase project is **not paused**
- Verify folders are saving to database
- Test cover image uploads

---

## Step 8: Post-Deployment Setup

### 8.1 Create Your First User

Since you don't have a signup page, create a user directly in Supabase:

1. Go to Supabase Dashboard → **Table Editor** → **users**
2. Click **"Insert row"**
3. Add:
   - `email`: your email
   - `password_hash`: Use bcrypt to hash your password
   - `is_admin`: true

**Or use this SQL in Supabase SQL Editor:**
```sql
-- Replace 'your-email@example.com' and 'your-password'
INSERT INTO users (email, password_hash, is_admin)
VALUES (
  'your-email@example.com',
  crypt('your-password', gen_salt('bf')),
  true
);
```

### 8.2 Add Your First Folders

1. Log in to your live site
2. Click **"ADD NEW FOLDER"**
3. Share Google Drive folders with: `keegan-driveapi@mythical-sweep-476412-u5.iam.gserviceaccount.com`
4. Paste folder URLs and add them

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Make sure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Environment variable not found"**
- Double-check all environment variables in Vercel
- Make sure there are no typos

### Database Connection Issues

**Error: "Can't reach database"**
- Check if Supabase project is paused
- Verify DATABASE_URL is correct
- Make sure Supabase allows connections from Vercel IPs

### Google Drive API Issues

**Error: "Invalid credentials"**
- Verify GOOGLE_PRIVATE_KEY is copied correctly (with line breaks)
- Check GOOGLE_CLIENT_EMAIL matches your service account
- Ensure folders are shared with the service account email

### Images Not Loading

**Error: "Failed to load image"**
- Check Google Drive folder permissions
- Verify service account has access
- Try re-sharing the folder

---

## Performance Optimization

### Enable Vercel Analytics (Optional)

1. Go to **Project Settings** → **Analytics**
2. Enable **Web Analytics**
3. Monitor page load times and performance

### Enable Caching

Your app already has:
- ✅ HTTP cache headers (5-10 minutes)
- ✅ Image lazy loading
- ✅ Optimized API responses

---

## Maintenance

### Updating Your Site

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys on push!
```

### Monitoring

- Check Vercel Dashboard for deployment status
- Monitor Supabase Dashboard for database usage
- Check Google Cloud Console for API usage

---

## Security Checklist

- ✅ Environment variables are in Vercel (not in code)
- ✅ `.env` file is in `.gitignore`
- ✅ Database credentials are secure
- ✅ Google Drive service account has minimal permissions
- ✅ Session secret is strong and unique
- ✅ HTTPS is enabled (automatic with Vercel)

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Google Drive API:** https://developers.google.com/drive

---

## Your Live URLs

After deployment, you'll have:

- **Production URL:** `https://your-app.vercel.app`
- **Custom Domain:** `https://yourdomain.com` (if configured)
- **Preview URLs:** Automatic for each git branch

---

## Success! 🎉

Your Personal Digital Diary is now live and accessible to the world!

**Next Steps:**
1. Share the URL with friends/family
2. Add more folders and photos
3. Customize the design further
4. Consider adding more features

Enjoy your beautiful photo gallery! 📸
