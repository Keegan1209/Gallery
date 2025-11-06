# Deployment Guide

## Quick Deploy to Production

Your app is ready to deploy with Supabase database integration! Here are the deployment options:

### Option 1: Automatic Setup (Recommended)

After deploying your app, run the setup script:

```bash
npm run db:setup
```

This will:
- Generate the Prisma client
- Push the database schema to Supabase
- Create the `folder_diaries` table

### Option 2: Manual Database Setup

If the automatic setup doesn't work, you can manually create the table in Supabase:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL from `migrations/001_create_folder_diaries.sql`

### Option 3: Individual Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

## Deployment Platforms

### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Add environment variables from your `.env` file
3. Deploy
4. Run `npm run db:setup` in Vercel's function logs or locally

### Netlify
1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Add environment variables
4. Deploy
5. Run database setup

### Railway/Render
1. Connect GitHub repo
2. Add environment variables
3. Deploy
4. Run database setup

## Environment Variables Required

Make sure these are set in your deployment platform:

```
DATABASE_URL=your_supabase_database_url
DIRECT_URL=your_supabase_direct_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_EMAIL=your_google_service_account_email
GOOGLE_PRIVATE_KEY=your_google_private_key
GOOGLE_PROJECT_ID=your_google_project_id
```

## Features Ready for Production

✅ **Performance Optimized Gallery**
- Lazy loading images
- Thumbnail optimization
- Progressive loading
- Client-side caching

✅ **Diary Entries**
- Auto-save functionality
- Supabase database storage
- Per-folder diary entries
- Character counter

✅ **Google Drive Integration**
- Service account authentication
- Image proxy for CORS handling
- Folder browsing

## Post-Deployment Checklist

1. ✅ App deploys successfully
2. ✅ Database connection works
3. ✅ Google Drive photos load
4. ✅ Diary entries save and load
5. ✅ Performance optimizations active

## Troubleshooting

### Database Connection Issues
- Check your Supabase connection strings
- Ensure database is not paused
- Verify environment variables

### Google Drive Issues
- Ensure service account has access to folders
- Check Google API credentials
- Verify folder IDs in configuration

### Performance Issues
- Check image proxy is working
- Verify thumbnail optimization
- Monitor loading times in browser dev tools

Your app is production-ready! 🚀