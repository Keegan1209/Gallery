# 🐛 Image Upload Debug Guide

## Issue: Uploaded image not showing on folder

Let's debug this step by step:

### 🔍 **Step 1: Check Browser Console**

Open browser dev tools (F12) and look for:

**During Upload:**
```
📸 Uploading cover image for folder: [folderId]
📄 File details: {name: "...", size: ..., type: "..."}
✅ Cover image processed for folder: [folderId]
```

**During Folder Update:**
```
🔄 Updating folder: [folderId] {displayName: "...", coverImage: "data:image/...", description: "..."}
✅ Updated existing category for folder: [folderId]
```

### 🔍 **Step 2: Check Network Tab**

1. **Upload Request**: `POST /api/folders/[folderId]/cover`
   - Should return: `{success: true, coverUrl: "data:image/..."}`

2. **Update Request**: `PUT /api/folders/update`
   - Should include coverImage in request body

3. **Folders Reload**: `GET /api/folders`
   - Should return folders with coverImage field

### 🔍 **Step 3: Manual Test**

Try this in browser console:
```javascript
// Check if folder has cover image
fetch('/api/folders')
  .then(r => r.json())
  .then(data => {
    console.log('Folders:', data.folders.map(f => ({
      name: f.name,
      coverImage: f.coverImage ? 'HAS COVER' : 'NO COVER'
    })))
  })
```

### 🛠️ **Common Issues & Fixes**

#### **Issue 1: Database Not Updated**
- **Symptom**: Upload works but image doesn't persist
- **Fix**: Run database migration in Supabase
- **SQL**: `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "cover_image" TEXT;`

#### **Issue 2: Base64 Too Large**
- **Symptom**: Upload fails or times out
- **Fix**: Use smaller images (< 1MB recommended)
- **Check**: File size in upload

#### **Issue 3: Image Not Refreshing**
- **Symptom**: Upload succeeds but folder still shows default icon
- **Fix**: Hard refresh page (Ctrl+F5)
- **Check**: Browser cache

#### **Issue 4: CORS or Security**
- **Symptom**: Upload blocked by browser
- **Fix**: Check if running on localhost
- **Check**: Console for security errors

### 🎯 **Expected Flow**

1. **Select File** → Preview appears in modal
2. **Click Upload** → "Uploading..." button
3. **Success** → "✅ Cover image uploaded and saved successfully"
4. **Auto-save** → Folder updates automatically
5. **Reload** → New cover image appears on folder card

### 🔧 **Quick Fixes**

#### **Fix 1: Force Refresh**
```javascript
// In browser console
location.reload(true)
```

#### **Fix 2: Clear Cache**
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache

#### **Fix 3: Check Image Size**
- Keep images under 1MB for best results
- Use JPG/PNG formats
- Avoid very large dimensions

### 📊 **Debug Checklist**

- [ ] File uploads successfully (check console)
- [ ] Base64 URL is generated
- [ ] Folder update API is called
- [ ] Folders list is reloaded
- [ ] Cover image appears in folder data
- [ ] Page refreshes to show new image

If all steps work but image still doesn't show, the issue is likely browser caching or the database schema not being updated yet.