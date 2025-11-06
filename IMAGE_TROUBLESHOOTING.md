# Image Loading Troubleshooting

## 🔍 Issue: Grey "Image" Placeholders

You're seeing grey boxes with "Image" text because some Google Drive images are failing to load. Here's how to diagnose and fix it:

## 🛠️ Debugging Steps

### 1. **Check Browser Console**
Open browser dev tools (F12) and look for error messages like:
- `❌ Image failed to load: /api/google-drive/image/[fileId]?size=thumbnail`
- `❌ Thumbnail failed for [fileId]:`
- `❌ Cannot access file [fileId]:`

### 2. **Test Individual Images**
Use the debug endpoint to check specific files:
```
/api/debug/image/[fileId]
```
This will show you:
- File metadata (name, type, size)
- Permissions
- Whether the file is actually an image

### 3. **Common Causes & Solutions**

#### **Cause 1: File Permissions**
- **Problem**: Google Drive file not shared with service account
- **Solution**: Share each folder with: `keegan-driveapi@mythical-sweep-476412-u5.iam.gserviceaccount.com`
- **Check**: Ensure "Editor" or "Viewer" access

#### **Cause 2: Non-Image Files**
- **Problem**: Files that look like images but aren't (e.g., .heic, .webp, corrupted files)
- **Solution**: Check file types in Google Drive
- **Check**: Look for console message `🚫 Skipping non-media file:`

#### **Cause 3: Large File Sizes**
- **Problem**: Very large images timing out
- **Solution**: Compress images or increase timeout
- **Check**: Look for timeout errors in console

#### **Cause 4: Google Drive API Limits**
- **Problem**: Too many requests hitting rate limits
- **Solution**: Implement request throttling
- **Check**: Look for 429 status codes

## 🔧 Quick Fixes

### **Fix 1: Improved Fallback (Already Applied)**
- Images now try full URL if thumbnail fails
- Better error logging in console
- Cleaner placeholder design

### **Fix 2: Check Folder Sharing**
1. Go to Google Drive
2. Right-click your photo folder
3. Click "Share"
4. Add: `keegan-driveapi@mythical-sweep-476412-u5.iam.gserviceaccount.com`
5. Set permission to "Viewer" or "Editor"

### **Fix 3: Remove Problem Files**
1. Check console for specific file IDs that fail
2. Go to Google Drive and check those files
3. Remove or replace corrupted/unsupported files

## 📊 Monitoring

The app now logs detailed information:
- `🖼️ Fetching thumbnail/full image for file: [fileId]`
- `📄 File metadata: {name, mimeType, size}`
- `❌ File [fileId] is not an image: [mimeType]`
- `📊 Found X total files, Y media files`

## 🚀 Expected Behavior

**Working images**: Load smoothly with lazy loading
**Failed images**: Show clean "Not Available" placeholder
**Mixed results**: Some images load, others show placeholder (normal if some files have issues)

## 🔍 Debug Checklist

- [ ] Check browser console for errors
- [ ] Verify folder sharing with service account
- [ ] Test debug endpoint for failing images
- [ ] Check file types in Google Drive
- [ ] Look for rate limiting (429 errors)
- [ ] Verify internet connection stability

Most image loading issues are due to permissions or file type problems. The improved error handling will help identify the specific cause! 🎯