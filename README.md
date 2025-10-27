# Google Drive Clone

A secure, private web application that creates a frontend interface for Google Drive photos and videos. Built with Next.js, TypeScript, and Supabase.

## 🌟 Features

- **🔐 Secure Authentication**: Supabase-powered user management with email/password login
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices
- **🗂️ Category Management**: Organize photos by Google Drive folders
- **🖼️ Gallery Interface**: Beautiful grid layout for viewing your memories
- **📝 Rich Descriptions**: Add personal notes and reflections to your photos
- **⭐ Favorites System**: Mark special memories as favorites
- **🔒 Private & Secure**: Only you control who has access

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (Supabase)
- **Storage**: Google Drive API integration
- **Deployment**: Vercel with custom domain support
- **Security**: JWT sessions, HTTPS enforcement, encrypted data

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Google account with Google Drive
- A Supabase account
- A Vercel account (for deployment)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd personal-digital-diary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your actual credentials in the `.env` file.

## ⚙️ Configuration

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **Settings** → **Database** and copy:
   - Connection string → `DATABASE_URL` and `DIRECT_URL`

### 2. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push
```

### 3. Create Admin User

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"**
4. Enter your email and secure password
5. Check **"Auto Confirm User"**

### 4. Google Drive API (Coming Soon)

Google Drive integration will be added in the next phase for photo management.

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` and login with your Supabase user credentials.

## 📁 Project Structure

```
personal-digital-diary/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   └── auth/          # Authentication endpoints
│   │   ├── login/             # Login page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Dashboard page
│   ├── components/            # React components (future)
│   ├── lib/                   # Utility libraries
│   │   └── prisma.ts          # Database client
│   └── middleware.ts          # Route protection
├── prisma/
│   └── schema.prisma          # Database schema
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🔐 Security Features

### Authentication
- **Supabase Auth**: Industry-standard authentication system
- **JWT Sessions**: Secure session management with automatic expiration
- **Route Protection**: Middleware protects all routes except login
- **Password Security**: Bcrypt hashing with secure session tokens

### Data Protection
- **HTTPS Only**: All traffic encrypted in transit
- **Environment Variables**: Sensitive data stored securely
- **Database Encryption**: Data encrypted at rest in Supabase
- **No Client-Side Secrets**: API keys never exposed to browser

### Access Control
- **Admin-Only User Management**: Only you can add/remove users
- **Session Timeout**: Automatic logout after inactivity
- **Secure Cookies**: HTTP-only, secure, SameSite cookies

## 👥 User Management

### Adding Users
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"**
4. Enter email and password
5. User can now login to your diary

### Removing Users
1. Go to Supabase dashboard → **Authentication** → **Users**
2. Find the user and click the delete button
3. User access is immediately revoked

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set Environment Variables**
   - Go to Vercel project settings
   - Add all variables from your `.env` file
   - Never commit `.env` to Git!

3. **Custom Domain**
   - Add your domain in Vercel project settings
   - SSL certificate is automatically provisioned

### Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Authentication
SESSION_SECRET="..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="..."

# Google Drive (Coming Soon)
GOOGLE_CLIENT_EMAIL="..."
GOOGLE_PRIVATE_KEY="..."
GOOGLE_PROJECT_ID="..."
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
```

## 🛡️ Security Checklist

- [ ] Strong admin password (20+ characters)
- [ ] Environment variables secured
- [ ] .env file not committed to Git
- [ ] HTTPS enabled in production
- [ ] Supabase 2FA enabled
- [ ] Vercel 2FA enabled
- [ ] Custom domain with SSL
- [ ] Regular security updates

## 🚨 Important Security Notes

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use strong passwords** - Minimum 20 characters with mixed case, numbers, symbols
3. **Enable 2FA** - On Supabase and Vercel accounts
4. **Regular updates** - Keep dependencies updated for security patches
5. **Monitor access** - Check Supabase auth logs regularly

## 🔄 Roadmap

### Phase 1: Core Authentication ✅
- [x] Supabase authentication integration
- [x] Secure login/logout system
- [x] Route protection middleware
- [x] User management through Supabase

### Phase 2: Google Drive Integration (Next)
- [ ] Google Drive API setup
- [ ] Folder browsing and selection
- [ ] Photo/video display
- [ ] Sync existing content

### Phase 3: Gallery Features (Future)
- [ ] Responsive photo grid
- [ ] Modal photo viewer
- [ ] Description editing
- [ ] Favorites system
- [ ] Search and filtering

### Phase 4: Advanced Features (Future)
- [ ] PWA support (mobile app-like)
- [ ] Dark mode toggle
- [ ] Bulk operations
- [ ] Export functionality

## 📞 Support

If you encounter issues:

1. Check the **Security Checklist** above
2. Verify all environment variables are set correctly
3. Test database and authentication connections
4. Check Vercel deployment logs for errors

## 📄 License

This project is private and proprietary. All rights reserved.

---

**Built with ❤️ for secure, private memory keeping.**
** ChatGPT Generated ReadMe may contain errors **
