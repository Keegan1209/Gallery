# Design Document

## Overview

The Personal Digital Diary is a Next.js full-stack application that provides a secure, private space for uploading and viewing personal media with reflective descriptions. The system uses a modern tech stack with Next.js 14+, TypeScript, Tailwind CSS, and shadcn/ui for the frontend, Next.js API routes for the backend, Supabase for storage and database, and Prisma as the ORM.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Gallery Grid  │    │ • Auth Middleware│   │ • Supabase DB   │
│ • Entry Modal   │    │ • Upload API    │    │ • Supabase      │
│ • Upload Form   │    │ • Entries API   │    │   Storage       │
│ • Navbar        │    │ • Session Mgmt  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend Framework**: Next.js 14+ with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide React
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: Supabase PostgreSQL with Prisma ORM
- **File Storage**: Supabase Storage
- **Authentication**: Custom session-based auth with bcrypt
- **Deployment**: Vercel

## Components and Interfaces

### Frontend Components

#### 1. Layout Components

**Navbar Component**
```typescript
interface NavbarProps {
  onAddEntry: () => void;
  onLogout: () => void;
}
```
- Displays app title "Personal Diary"
- "Add Entry" button to trigger upload form
- Logout button with confirmation
- Responsive design for mobile/desktop

**Layout Component**
- Wraps all authenticated pages
- Includes Navbar
- Handles global state and modals

#### 2. Gallery Components

**CategorySelector Component**
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  entry_count: number;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null; // null = "All Categories"
  onCategorySelect: (categoryId: string | null) => void;
  onCreateCategory: () => void;
}
```
- Horizontal scrollable category tabs
- "All Categories" option to view everything
- "+" button to create new categories
- Shows entry count for each category

**GalleryGrid Component**
```typescript
interface Entry {
  id: string;
  title?: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  category_id: string;
  category: Category;
}

interface GalleryGridProps {
  entries: Entry[];
  onEntryClick: (entry: Entry) => void;
  selectedCategory: string | null;
}
```
- Responsive CSS Grid layout (1-4 columns based on screen size)
- Filters entries by selected category
- Entry preview cards with:
  - Thumbnail/preview of media
  - Truncated description (2-3 lines)
  - Creation date
  - Category badge
  - Hover effects and click handlers

**EntryCard Component**
```typescript
interface EntryCardProps {
  entry: Entry;
  onClick: (entry: Entry) => void;
}
```
- Individual entry display in grid
- Lazy loading for media thumbnails
- Responsive aspect ratio containers

#### 3. Modal Components

**EntryModal Component**
```typescript
interface EntryModalProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
}
```
- Full-screen overlay with entry details
- Media display (image or video with controls)
- Complete description and metadata
- Close on ESC key or outside click
- Responsive design for mobile

#### 4. Form Components

**UploadForm Component**
```typescript
interface UploadFormProps {
  isOpen: boolean;
  categories: Category[];
  selectedCategory?: string;
  onClose: () => void;
  onSuccess: () => void;
}
```
- File input with drag-and-drop support
- Category selection dropdown (required)
- File type validation (images: JPEG, PNG, WebP; videos: MP4, WebM)
- File size limits (10MB for images, 50MB for videos)
- Title field (optional)
- Description field (required)
- Upload progress indicator
- Form validation and error handling

**CategoryForm Component**
```typescript
interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: Category) => void;
}
```
- Category name input (required, unique)
- Category description input (optional)
- Form validation for duplicate names
- Create button with loading state

#### 5. Authentication Components

**LoginForm Component**
```typescript
interface LoginFormProps {
  onLogin: (password: string) => Promise<void>;
}
```
- Password input field
- Submit button
- Error message display
- Remember session checkbox

### Backend API Endpoints

#### Authentication Endpoints

**POST /api/auth/login**
```typescript
interface LoginRequest {
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
}
```

**POST /api/auth/logout**
- Clears session cookie
- Returns success confirmation

#### Entry Management Endpoints

**GET /api/categories**
```typescript
interface CategoriesResponse {
  categories: Category[];
}
```
- Returns all categories with entry counts
- Sorted alphabetically by name

**POST /api/categories**
```typescript
interface CreateCategoryRequest {
  name: string;
  description?: string;
}

interface CreateCategoryResponse {
  category: Category;
}
```
- Creates new category
- Validates unique category names

**GET /api/categories/[id]/entries**
```typescript
interface CategoryEntriesResponse {
  category: Category;
  entries: Entry[];
}
```
- Returns all entries for a specific category
- Includes category details and entries sorted by created_at DESC

**GET /api/entries**
```typescript
interface EntriesResponse {
  entries: Entry[];
}
```
- Returns all entries across all categories sorted by created_at DESC
- Includes category information for each entry

**GET /api/entries/[id]**
```typescript
interface EntryResponse {
  entry: Entry;
}
```
- Returns single entry by ID
- 404 if entry not found

**POST /api/entries**
```typescript
interface CreateEntryRequest {
  title?: string;
  description: string;
  category_id: string;
  file: File;
}

interface CreateEntryResponse {
  entry: Entry;
}
```
- Handles file upload to Supabase Storage
- Creates database record linked to specified category
- Returns created entry with category information

**DELETE /api/entries/[id]** (Optional)
```typescript
interface DeleteResponse {
  success: boolean;
}
```
- Deletes entry from database
- Removes file from Supabase Storage

## Data Models

### Database Schema (Prisma)

```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Relationship to entries
  entries     Entry[]

  @@map("categories")
}

model Entry {
  id          String   @id @default(uuid())
  title       String?
  description String
  media_url   String
  media_type  String   // 'image' | 'video'
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Foreign key to category
  category_id String
  category    Category @relation(fields: [category_id], references: [id], onDelete: Cascade)

  @@map("entries")
}
```

### Database Relationships Explained

**Category → Entry Relationship (One-to-Many)**
- Each Category can have unlimited entries
- Each Entry belongs to exactly one Category
- When a Category is deleted, all its entries are also deleted (Cascade)
- Categories are identified by unique names (e.g., "Vacation 2024", "Family", "Work")

**Example Database Records:**

Categories Table:
```
id: "cat-1" | name: "Vacation 2024" | description: "Summer trip photos"
id: "cat-2" | name: "Family"        | description: "Family moments"
id: "cat-3" | name: "Work"          | description: "Work-related content"
```

Entries Table:
```
id: "entry-1" | title: "Beach Day"     | category_id: "cat-1" | media_url: "vacation/beach.jpg"
id: "entry-2" | title: "Sunset View"  | category_id: "cat-1" | media_url: "vacation/sunset.mp4"
id: "entry-3" | title: "Family Dinner"| category_id: "cat-2" | media_url: "family/dinner.jpg"
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Authentication
ADMIN_PASSWORD_HASH="$2b$10$..."
SESSION_SECRET="random-secret-key"

# Next.js
NEXTAUTH_URL="https://diary.keegan.cloud"
NEXTAUTH_SECRET="another-random-secret"
```

## Error Handling

### Frontend Error Handling

1. **Network Errors**: Toast notifications for API failures
2. **File Upload Errors**: Inline form validation messages
3. **Authentication Errors**: Redirect to login with error message
4. **Media Loading Errors**: Fallback placeholders and retry options

### Backend Error Handling

1. **Authentication Middleware**: 401 responses for unauthorized access
2. **File Upload Validation**: 400 responses with specific error messages
3. **Database Errors**: 500 responses with generic error messages (no sensitive data)
4. **File Storage Errors**: Retry logic and fallback error responses

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
```

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- API route testing with Jest
- Utility function testing
- Database model validation testing

### Integration Testing
- Authentication flow testing
- File upload and storage testing
- End-to-end entry creation and retrieval
- Database migration testing

### Manual Testing Checklist
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness testing
- File upload with various formats and sizes
- Authentication and session management
- Performance testing with multiple entries

## Security Considerations

### Authentication Security
- Password hashing with bcrypt (minimum 10 rounds)
- Secure session management with HTTP-only cookies
- CSRF protection for state-changing operations
- Session timeout after inactivity

### File Upload Security
- File type validation on both client and server
- File size limits to prevent abuse
- Virus scanning (future enhancement)
- Secure file naming to prevent path traversal

### Data Protection
- HTTPS enforcement in production
- Environment variable protection
- Database connection security
- No sensitive data in client-side code

## Performance Optimizations

### Frontend Performance
- Image lazy loading and optimization
- Code splitting with Next.js dynamic imports
- Caching strategies for static assets
- Responsive image serving

### Backend Performance
- Database query optimization
- File upload streaming
- CDN integration for media delivery
- API response caching where appropriate

## Deployment Configuration

### Vercel Deployment
- Automatic deployments from Git repository
- Environment variable configuration
- Custom domain setup (diary.keegan.cloud)
- SSL certificate automatic provisioning
- Edge function optimization for API routes

### Database Migration Strategy
- Prisma migration files in version control
- Automated migration deployment
- Database backup strategy
- Rollback procedures for failed deployments