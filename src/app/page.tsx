'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// TypeScript interface for folder data structure
interface Folder {
  id: string
  name: string
  description?: string
  createdTime: string
  fileCount: number
  hasImages: boolean
  hasVideos: boolean
  coverImage?: string // EDIT: Add cover image URL for folder
}

/**
 * HOMEPAGE LAYOUT - Based on Reference Design
 * 
 * Layout Structure:
 * - Top Left: Website Name
 * - Top Right: Add New Folder Button
 * - Center: Scrollable Folder Carousel (3 columns)
 * - Bottom: Description Text (Lorem Ipsum)
 * 
 * Features:
 * - Minimal Helvetica styling
 * - Folder cover image selection
 * - Horizontal scrolling for many folders
 * - Clean, academic layout
 */
export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [folderUrl, setFolderUrl] = useState('')
  const [folderName, setFolderName] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // EDIT FOLDER MODAL STATES
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editCoverImage, setEditCoverImage] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [updating, setUpdating] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)



  // Load folders when component mounts
  useEffect(() => {
    loadFolders()
  }, [])

  /**
   * Handle user logout
   * Calls logout API and redirects to login page
   */
  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load all folders from both config and database
   * Combines manually configured folders with user-added folders
   */
  const loadFolders = async () => {
    setLoadingFolders(true)
    try {
      // Fetch folders from API (combines config + database folders)
      const response = await fetch('/api/folders')
      const data = await response.json()

      if (data.success) {
        console.log('📁 Loaded folders:', data.folders.map(f => ({
          name: f.name,
          coverImage: f.coverImage ? 'HAS_COVER' : 'NO_COVER',
          coverImagePreview: f.coverImage ? f.coverImage.substring(0, 50) + '...' : null
        })))
        setFolders(data.folders)
      }
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setLoadingFolders(false)
    }
  }

  const viewFolderPhotos = (folder: Folder) => {
    router.push(`/folder/${folder.id}?name=${encodeURIComponent(folder.name)}`)
  }

  const removeFolder = async (folder: Folder) => {
    if (!confirm(`Delete "${folder.name}" from gallery?\n\n(Google Drive folder stays safe)`)) {
      return
    }

    try {
      const response = await fetch('/api/folders/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: folder.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ ${data.message}`)
        loadFolders()
      } else {
        setMessage(`❌ Failed to remove folder: ${data.message}`)
      }
    } catch (error) {
      setMessage('❌ Error removing folder')
    }
  }

  const addFolder = async () => {
    if (!folderUrl.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/folders/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: folderUrl.trim(),
          name: folderName.trim() || undefined,
          description: folderDescription.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ Added folder: ${data.folder.name}`)
        setFolderUrl('')
        setFolderName('')
        setFolderDescription('')
        setShowCreateModal(false)
        loadFolders()
      } else {
        setMessage(`❌ Failed to add folder: ${data.message}`)
      }
    } catch (error) {
      setMessage('❌ Error adding folder')
    } finally {
      setCreating(false)
    }
  }

  /**
   * UPDATE FOLDER - Edit display name, cover image, description
   */
  const updateFolder = async () => {
    if (!editingFolder) return

    setUpdating(true)
    try {
      const response = await fetch('/api/folders/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: editingFolder.id,
          displayName: editDisplayName.trim() || undefined,
          coverImage: editCoverImage.trim() || undefined,
          description: editDescription.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ Updated folder: ${editDisplayName || editingFolder.name}`)
        setShowEditModal(false)
        setEditingFolder(null)
        loadFolders() // Reload to show changes
      } else {
        setMessage(`❌ Failed to update folder: ${data.message}`)
      }
    } catch (error) {
      setMessage('❌ Error updating folder')
    } finally {
      setUpdating(false)
    }
  }

  /**
   * DELETE FOLDER - Remove from edit modal
   */
  const deleteFolderFromEdit = async () => {
    if (!editingFolder) return

    if (!confirm(`Delete "${editingFolder.name}" from gallery?\n\n(Google Drive folder stays safe)`)) {
      return
    }

    try {
      const response = await fetch('/api/folders/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: editingFolder.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ ${data.message}`)
        setShowEditModal(false)
        setEditingFolder(null)
        loadFolders()
      } else {
        setMessage(`❌ Failed to remove folder: ${data.message}`)
      }
    } catch (error) {
      setMessage('❌ Error removing folder')
    }
  }

  /**
   * COVER IMAGE UPLOAD FUNCTIONS
   */
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setMessage('❌ Image must be less than 5MB')
      return
    }

    setCoverFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadCoverImage = async () => {
    if (!coverFile || !editingFolder) return

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', coverFile)

      const response = await fetch(`/api/folders/${editingFolder.id}/cover`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      console.log('Upload response:', data)

      if (data.success) {
        setEditCoverImage(data.coverUrl)
        setCoverPreview(data.coverUrl)
        
        console.log('Cover URL set:', data.coverUrl.substring(0, 50) + '...')
        
        // Automatically save the folder with the new cover image
        await updateFolderWithCover(data.coverUrl)
        
        setMessage('✅ Cover image uploaded and saved successfully')
      } else {
        console.error('Upload failed:', data)
        setMessage(`❌ Failed to upload image: ${data.message}`)
      }
    } catch (error) {
      setMessage('❌ Error uploading image')
    } finally {
      setUploadingCover(false)
    }
  }

  const updateFolderWithCover = async (coverUrl: string) => {
    if (!editingFolder) return

    try {
      const response = await fetch('/api/folders/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: editingFolder.id,
          displayName: editDisplayName.trim() || undefined,
          coverImage: coverUrl,
          description: editDescription.trim() || undefined
        }),
      })

      const data = await response.json()

      console.log('Folder update response:', data)

      if (data.success) {
        console.log('✅ Folder updated, reloading folders...')
        // Reload folders to show the new cover image
        loadFolders()
      } else {
        console.error('❌ Folder update failed:', data)
      }
    } catch (error) {
      console.error('Error updating folder with cover:', error)
    }
  }

  const removeCoverImage = async () => {
    if (!editingFolder) return

    try {
      const response = await fetch(`/api/folders/${editingFolder.id}/cover`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setEditCoverImage('')
        setCoverPreview(null)
        setCoverFile(null)
        setMessage('✅ Cover image removed')
      } else {
        setMessage(`❌ Failed to remove image: ${data.message}`)
      }
    } catch (error) {
      setMessage('❌ Error removing image')
    }
  }



  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff', // EDIT: Main page background - clean white
      fontFamily: 'Helvetica, Arial, sans-serif', // EDIT: Helvetica font family as requested
      color: '#000000'
    }}>

      {/* 
      ========================================
      TOP HEADER BAR - Website name left, Add folder right
      ========================================
      */}
      <div
        className="header-container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '40px 60px 20px 60px', // EDIT: Header padding - top, right, bottom, left
          maxWidth: '1400px', // EDIT: Max width of header
          margin: '0 auto'
        }}>

        {/* LEFT: Website Name */}
        <div style={{
          maxWidth: '400px' // EDIT: Max width of website name area
        }}>
          <h1
            className="website-title"
            style={{
              fontSize: '18px', // EDIT: Website name font size
              fontWeight: 'normal', // EDIT: Font weight - normal for minimal look
              color: '#000000', // EDIT: Website name color
              margin: 0,
              lineHeight: '1.3',
              letterSpacing: '0.5px' // EDIT: Letter spacing for clean look
            }}>
            LILLY & KEEGAN {/* EDIT: Change website name here */}
          </h1>
          <div
            className="website-subtitle"
            style={{
              fontSize: '18px', // EDIT: Subtitle font size
              fontWeight: 'normal',
              color: '#000000',
              margin: '5px 0 0 0',
              lineHeight: '1.3'
            }}>
            VISUAL DIARY {/* EDIT: Change subtitle here */}
          </div>
          <div
            className="website-subtitle"
            style={{
              fontSize: '18px', // EDIT: Third line font size
              fontWeight: 'normal',
              color: '#000000',
              margin: '5px 0 0 0',
              lineHeight: '1.3'
            }}>
             {/* EDIT: Change third line here */}
          </div>
        </div>

        {/* RIGHT: Navigation & Add Folder Button */}
        <div
          className="nav-container"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '30px' // EDIT: Gap between navigation items
          }}>
          {/* Navigation Menu - EDIT: Add/remove navigation items here */}
          <div
            className="nav-menu"
            style={{
              display: 'flex',
              gap: '25px', // EDIT: Gap between nav items
              fontSize: '12px', // EDIT: Navigation font size
              fontWeight: 'normal',
              color: '#666666' // EDIT: Navigation text color
            }}>
            <span style={{ cursor: 'pointer' }}>COLLECTIONS</span> {/* EDIT: Nav item 1 */}
            <span style={{ cursor: 'pointer' }}>MEMORIES</span> {/* EDIT: Nav item 2 */}
            <span style={{ cursor: 'pointer' }}>ARCHIVE</span> {/* EDIT: Nav item 3 */}
            <span style={{ cursor: 'pointer' }}>ABOUT</span> {/* EDIT: Nav item 4 */}
          </div>

          {/* Add Folder Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: 'transparent', // EDIT: Button background
              color: '#000000', // EDIT: Button text color
              border: '1px solid #000000', // EDIT: Button border
              padding: '8px 16px', // EDIT: Button padding
              fontSize: '12px', // EDIT: Button font size
              fontWeight: 'normal',
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            ADD NEW FOLDER {/* EDIT: Button text */}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              backgroundColor: 'transparent',
              color: '#666666', // EDIT: Logout button color
              border: 'none',
              padding: '8px 0',
              fontSize: '12px',
              fontWeight: 'normal',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'LOGGING OUT...' : 'LOGOUT'}
          </button>
        </div>
      </div>

      {/* 
      ========================================
      CENTER SECTION TITLE - "COLLECTIONS" or similar
      ========================================
      */}
      <div
        className="center-title"
        style={{
          textAlign: 'center',
          margin: '60px 0 40px 0' // EDIT: Spacing around center title
        }}>
        <h2 style={{
          fontSize: '24px', // EDIT: Center title font size
          fontWeight: 'normal', // EDIT: Font weight
          color: '#000000', // EDIT: Center title color
          margin: 0,
          letterSpacing: '2px' // EDIT: Letter spacing for clean look
        }}>
          COLLECTIONS 
          {/* EDIT: Change center section title here */}
        </h2>
      </div>

      {/* 
      ========================================
      SUCCESS/ERROR MESSAGES - Minimal styling
      ========================================
      */}
      {message && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 30px auto',
          padding: '15px 60px',
          fontSize: '12px', // EDIT: Message font size
          color: message.startsWith('✅') ? '#000000' : '#cc0000', // EDIT: Message colors
          textAlign: 'center',
          border: message.startsWith('❌') ? '1px solid #cc0000' : 'none' // EDIT: Error border
        }}>
          {message}
        </div>
      )}

      {/* 
      ========================================
      LOADING STATE - Minimal loading indicator
      ========================================
      */}
      {
        loadingFolders && (
          <div style={{
            textAlign: 'center',
            padding: '80px 0',
            fontSize: '14px', // EDIT: Loading text size
            color: '#666666', // EDIT: Loading text color
            letterSpacing: '1px'
          }}>
            Loading collections... {/* EDIT: Loading text */}
          </div>
        )
      }

      {/* 
      ========================================
      FOLDERS CAROUSEL - 3 Column Grid with Horizontal Scroll
      ========================================
      */}
      {
        !loadingFolders && folders.length > 0 && (
          <div
            className="collections-container"
            style={{
              maxWidth: '1200px', // EDIT: Max width of carousel container
              margin: '0 auto',
              padding: '0 60px' // EDIT: Side padding
            }}>
            {/* Horizontal Scrollable Container */}
            <div style={{
              display: 'flex', // EDIT: Changed to flex for horizontal scrolling
              gap: '40px', // EDIT: Gap between folder cards
              overflowX: 'auto', // EDIT: Always allow horizontal scroll
              overflowY: 'hidden',
              paddingBottom: '20px', // EDIT: Padding for scrollbar
              scrollBehavior: 'smooth', // EDIT: Smooth scrolling
              // EDIT: Custom scrollbar styling
              scrollbarWidth: 'thin',
              scrollbarColor: '#cccccc #f5f5f5'
            }}>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="folder-card"
                  style={{
                    minWidth: '320px', // EDIT: Fixed card width for horizontal scrolling
                    maxWidth: '320px', // EDIT: Max width to maintain consistent sizing
                    flexShrink: 0, // EDIT: Prevent cards from shrinking
                    cursor: 'pointer',
                    position: 'relative' // EDIT: For positioning edit button
                  }}
                  onClick={() => viewFolderPhotos(folder)}
                >


                  {/* 
                ========================================
                EDIT BUTTON - Small edit button on each folder
                ========================================
                */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation() // EDIT: Prevent folder click
                      setEditingFolder(folder)
                      setEditDisplayName(folder.name)
                      setEditDescription(folder.description || '')
                      
                      // Load existing cover image
                      try {
                        const coverResponse = await fetch(`/api/folders/${folder.id}/cover`)
                        const coverData = await coverResponse.json()
                        if (coverData.success && coverData.coverUrl) {
                          setEditCoverImage(coverData.coverUrl)
                          setCoverPreview(coverData.coverUrl)
                        } else {
                          setEditCoverImage(folder.coverImage || '')
                          setCoverPreview(folder.coverImage || null)
                        }
                      } catch (error) {
                        console.log('Could not load cover image:', error)
                        setEditCoverImage(folder.coverImage || '')
                        setCoverPreview(folder.coverImage || null)
                      }
                      
                      // Reset upload states
                      setCoverFile(null)
                      
                      setShowEditModal(true)
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px', // EDIT: Position from top
                      right: '8px', // EDIT: Position from right
                      backgroundColor: 'transparent', // EDIT: No background
                      color: '#666666', // EDIT: Subtle text color
                      border: 'none', // EDIT: No border
                      padding: '2px 4px', // EDIT: Minimal padding
                      fontSize: '11px', // EDIT: Small font size
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      fontWeight: 'normal',
                      cursor: 'pointer',
                      zIndex: 10,
                      textDecoration: 'none', // EDIT: No underline by default
                      transition: 'text-decoration 0.2s ease' // EDIT: Smooth underline transition
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline' // EDIT: Underline on hover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none' // EDIT: Remove underline
                    }}
                    title="Edit folder settings"
                  >
                    EDIT {/* EDIT: Edit icon */}
                  </button>
                  {/* 
                ========================================
                FOLDER IMAGE - Cover image or placeholder
                ========================================
                */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '4/3', // EDIT: Image aspect ratio (4:3 like reference)
                    backgroundColor: '#f5f5f5', // EDIT: Placeholder background
                    backgroundImage: folder.coverImage ? `url(${folder.coverImage})` : 'none', // EDIT: Cover image
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid #cccccc', // EDIT: Image border
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px', // EDIT: Placeholder icon size
                    color: '#cccccc',
                    marginBottom: '15px' // EDIT: Space below image
                  }}>
                    {!folder.coverImage && '📁'} {/* EDIT: Placeholder icon when no cover image */}
                  </div>

                  {/* 
                ========================================
                FOLDER INFO - Date, Title, Description
                ========================================
                */}
                  <div>
                    {/* Date */}
                    <div style={{
                      fontSize: '11px', // EDIT: Date font size
                      color: '#666666', // EDIT: Date color
                      marginBottom: '5px',
                      letterSpacing: '0.5px'
                    }}>
                      {new Date(folder.createdTime).toLocaleDateString('en-GB', { // EDIT: Date format
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '.')} {/* EDIT: Date separator */}
                    </div>

                    {/* Folder Name/Title */}
                    <h3 style={{
                      fontSize: '14px', // EDIT: Title font size
                      fontWeight: 'bold', // EDIT: Title font weight
                      color: '#000000', // EDIT: Title color
                      margin: '0 0 8px 0',
                      lineHeight: '1.3',
                      letterSpacing: '0.5px'
                    }}>
                      {folder.name.toUpperCase()} {/* EDIT: Convert to uppercase like reference */}
                    </h3>

                    {/* Description */}
                    <p style={{
                      fontSize: '12px', // EDIT: Description font size
                      color: '#000000', // EDIT: Description color
                      margin: '0 0 8px 0',
                      lineHeight: '1.4',
                      fontWeight: 'normal'
                    }}>
                      {folder.description || `Collection of ${folder.fileCount} memories from your digital archive.`} {/* EDIT: Default description */}
                    </p>

                    {/* File Count */}
                    <div style={{
                      fontSize: '11px', // EDIT: File count font size
                      color: '#666666', // EDIT: File count color
                      letterSpacing: '0.5px'
                    }}>
                      {folder.fileCount} {folder.fileCount === 1 ? 'FILE' : 'FILES'} {/* EDIT: File count text */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* 
      ========================================
      EMPTY STATE - Minimal empty state
      ========================================
      */}
      {
        !loadingFolders && folders.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '100px 60px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              fontSize: '14px', // EDIT: Empty state font size
              color: '#666666', // EDIT: Empty state color
              lineHeight: '1.6',
              letterSpacing: '0.5px'
            }}>
              No collections found. Click "ADD NEW FOLDER" to begin building your digital archive. {/* EDIT: Empty state text */}
            </div>
          </div>
        )
      }

      {/* 
      ========================================
      BOTTOM DESCRIPTION - Lorem Ipsum text
      ========================================
      */}
      <div
        className="footer-container"
        style={{
          maxWidth: '1200px', // EDIT: Max width of description area
          margin: '100px auto 60px auto', // EDIT: Spacing around description
          padding: '0 60px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr', // EDIT: Two column layout like reference
          gap: '60px' // EDIT: Gap between columns
        }}>
        {/* Left Column */}
        <div>
          <p style={{
            fontSize: '12px', // EDIT: Description font size
            color: '#000000', // EDIT: Description color
            lineHeight: '1.6', // EDIT: Line height
            margin: 0,
            textAlign: 'justify' // EDIT: Text alignment
          }}>
            Research platform devoted to critical thinking and digital imagination, initiated and coordinated by Memory Preservation Institute and Digital Storytelling Lab at École Supérieure d'Art et Design - Grenoble - Valencia. {/* EDIT: Left column text */}
          </p>
        </div>

        {/* Right Column */}
        <div>
          <p style={{
            fontSize: '12px',
            color: '#000000',
            lineHeight: '1.6',
            margin: 0,
            textAlign: 'justify'
          }}>
            École Supérieure d'Art et Design - Grenoble<br />
            25 rue Lesdiguières - 38000 Grenoble - FRANCE<br />
            E: personaldigitaldiary@gmail.com<br />
            T: +33 (0) 4 76 86 61 30 {/* EDIT: Right column contact info */}
          </p>
        </div>
      </div>

      {/* 
      ========================================
      ADD FOLDER MODAL - Edit modal styling here
      ========================================
      */}
      {
        showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', // EDIT: Modal overlay color
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#ffffff', // EDIT: Modal background
              border: '4px solid #000000', // EDIT: Modal border
              width: '90%',
              maxWidth: '500px', // EDIT: Modal max width
              margin: '20px'
            }}>
              {/* MODAL HEADER */}
              <div style={{
                backgroundColor: '#f5f5f5', // EDIT: Modal header background
                borderBottom: '2px solid #000000', // EDIT: Modal header border
                padding: '15px',
                fontSize: '16px', // EDIT: Modal header font size
                fontWeight: 'bold',
                color: '#000000' // EDIT: Modal header text color
              }}>
                ADD GOOGLE DRIVE FOLDER {/* EDIT: Modal title */}
              </div>

              {/* MODAL CONTENT */}
              <div style={{ padding: '20px' }}>
                {/* INSTRUCTIONS BOX */}
                <div style={{
                  backgroundColor: '#f5f5f5', // EDIT: Instructions box background
                  border: '2px solid #000000', // EDIT: Instructions box border
                  padding: '12px',
                  marginBottom: '15px',
                  fontSize: '12px', // EDIT: Instructions font size
                  lineHeight: '1.4'
                }}>
                  <strong>STEPS:</strong><br />
                  1. Create folder in Google Drive<br />
                  2. Share with: <code style={{ backgroundColor: '#fff', padding: '2px 4px', border: '1px solid #000' }}>keegan-driveapi@mythical-sweep-476412-u5.iam.gserviceaccount.com</code><br />
                  3. Copy folder URL and paste below
                </div>

                {/* URL INPUT */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px', // EDIT: Label font size
                    fontWeight: 'bold',
                    color: '#000000', // EDIT: Label color
                    marginBottom: '5px'
                  }}>
                    GOOGLE DRIVE FOLDER URL * {/* EDIT: URL label text */}
                  </label>
                  <input
                    type="url"
                    value={folderUrl}
                    onChange={(e) => setFolderUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..." // EDIT: URL placeholder
                    style={{
                      width: '100%',
                      padding: '8px', // EDIT: Input padding
                      border: '2px solid #000000', // EDIT: Input border
                      fontSize: '14px', // EDIT: Input font size
                      borderRadius: '0', // EDIT: Keep 0 for Y2K style
                      boxSizing: 'border-box'
                    }}
                    autoFocus
                  />
                </div>

                {/* NAME INPUT */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginBottom: '5px'
                  }}>
                    CUSTOM NAME (OPTIONAL) {/* EDIT: Name label text */}
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Leave empty to use Google Drive name" // EDIT: Name placeholder
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #000000',
                      fontSize: '14px',
                      borderRadius: '0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* DESCRIPTION INPUT */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginBottom: '5px'
                  }}>
                    DESCRIPTION (OPTIONAL) {/* EDIT: Description label text */}
                  </label>
                  <textarea
                    value={folderDescription}
                    onChange={(e) => setFolderDescription(e.target.value)}
                    placeholder="e.g., Summer vacation memories" // EDIT: Description placeholder
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #000000',
                      fontSize: '14px',
                      borderRadius: '0',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* MODAL BUTTONS */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* CANCEL BUTTON */}
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setFolderUrl('')
                      setFolderName('')
                      setFolderDescription('')
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#ffffff', // EDIT: Cancel button background
                      color: '#000000', // EDIT: Cancel button text color
                      border: '2px solid #000000', // EDIT: Cancel button border
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '0'
                    }}
                  >
                    CANCEL {/* EDIT: Cancel button text */}
                  </button>

                  {/* ADD BUTTON */}
                  <button
                    onClick={addFolder}
                    disabled={creating || !folderUrl.trim()}
                    style={{
                      flex: 1,
                      backgroundColor: creating || !folderUrl.trim() ? '#cccccc' : '#000000', // EDIT: Add button colors
                      color: creating || !folderUrl.trim() ? '#666666' : '#ffffff', // EDIT: Add button text colors
                      border: `2px solid #000000`,
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: creating || !folderUrl.trim() ? 'not-allowed' : 'pointer',
                      borderRadius: '0'
                    }}
                  >
                    {creating ? 'ADDING...' : 'ADD FOLDER'} {/* EDIT: Add button text */}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* 
      ========================================
      EDIT FOLDER MODAL - Edit display name, cover image, description, delete
      ========================================
      */}
      {
        showEditModal && editingFolder && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', // EDIT: Modal overlay color
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            fontFamily: 'Helvetica, Arial, sans-serif'
          }}>
            <div style={{
              backgroundColor: '#ffffff', // EDIT: Modal background
              border: '1px solid #cccccc', // EDIT: Modal border
              width: '90%',
              maxWidth: '500px', // EDIT: Modal max width
              margin: '20px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              {/* MODAL HEADER */}
              <div style={{
                backgroundColor: '#f5f5f5', // EDIT: Modal header background
                borderBottom: '1px solid #cccccc', // EDIT: Modal header border
                padding: '20px',
                fontSize: '14px', // EDIT: Modal header font size
                fontWeight: 'bold',
                color: '#000000' // EDIT: Modal header text color
              }}>
                EDIT FOLDER: {editingFolder?.name.toUpperCase()} {/* EDIT: Modal title */}
              </div>

              {/* MODAL CONTENT */}
              <div style={{ padding: '20px' }}>

                {/* DISPLAY NAME INPUT */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px', // EDIT: Label font size
                    fontWeight: 'bold',
                    color: '#000000', // EDIT: Label color
                    marginBottom: '8px',
                    letterSpacing: '0.5px'
                  }}>
                    DISPLAY NAME {/* EDIT: Display name label */}
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Enter custom display name" // EDIT: Display name placeholder
                    style={{
                      width: '100%',
                      padding: '10px', // EDIT: Input padding
                      border: '1px solid #cccccc', // EDIT: Input border
                      fontSize: '14px', // EDIT: Input font size
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* COVER IMAGE UPLOAD */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginBottom: '8px',
                    letterSpacing: '0.5px'
                  }}>
                    COVER IMAGE
                  </label>

                  {/* FILE UPLOAD INPUT */}
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileSelect}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #cccccc',
                        fontSize: '14px',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{
                      fontSize: '11px',
                      color: '#666666',
                      marginTop: '5px',
                      lineHeight: '1.4'
                    }}>
                      Upload an image file (max 5MB, recommended 4:3 aspect ratio)
                    </div>
                  </div>

                  {/* UPLOAD BUTTON */}
                  {coverFile && (
                    <div style={{ marginBottom: '10px' }}>
                      <button
                        onClick={uploadCoverImage}
                        disabled={uploadingCover}
                        style={{
                          backgroundColor: uploadingCover ? '#cccccc' : '#000000',
                          color: uploadingCover ? '#666666' : '#ffffff',
                          border: '1px solid #000000',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: uploadingCover ? 'not-allowed' : 'pointer',
                          letterSpacing: '0.5px',
                          marginRight: '10px'
                        }}
                      >
                        {uploadingCover ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                      </button>
                      <button
                        onClick={() => {
                          setCoverFile(null)
                          setCoverPreview(null)
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#666666',
                          border: '1px solid #cccccc',
                          padding: '8px 16px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          letterSpacing: '0.5px'
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                  )}

                  {/* IMAGE PREVIEW */}
                  {(coverPreview || editCoverImage) && (
                    <div style={{
                      border: '1px solid #cccccc',
                      padding: '10px',
                      textAlign: 'center',
                      marginBottom: '10px'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666666', marginBottom: '8px' }}>
                        CURRENT COVER IMAGE:
                      </div>
                      <img
                        src={coverPreview || editCoverImage}
                        alt="Cover preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '120px',
                          objectFit: 'cover',
                          border: '1px solid #cccccc'
                        }}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <button
                          onClick={removeCoverImage}
                          style={{
                            backgroundColor: '#cc0000',
                            color: '#ffffff',
                            border: '1px solid #cc0000',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            letterSpacing: '0.5px'
                          }}
                        >
                          REMOVE IMAGE
                        </button>
                      </div>
                    </div>
                  )}

                  {/* URL INPUT (ALTERNATIVE) */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#666666',
                      marginBottom: '5px',
                      letterSpacing: '0.5px'
                    }}>
                      OR ENTER IMAGE URL:
                    </label>
                    <input
                      type="url"
                      value={editCoverImage}
                      onChange={(e) => setEditCoverImage(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #cccccc',
                        fontSize: '12px',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* DESCRIPTION INPUT */}
                <div style={{ marginBottom: '30px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginBottom: '8px',
                    letterSpacing: '0.5px'
                  }}>
                    DESCRIPTION {/* EDIT: Description label */}
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter folder description" // EDIT: Description placeholder
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #cccccc',
                      fontSize: '14px',
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* MODAL BUTTONS */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  borderTop: '1px solid #cccccc', // EDIT: Button area border
                  paddingTop: '20px'
                }}>
                  {/* DELETE BUTTON */}
                  <button
                    onClick={deleteFolderFromEdit}
                    style={{
                      backgroundColor: '#cc0000', // EDIT: Delete button background
                      color: '#ffffff', // EDIT: Delete button text color
                      border: '1px solid #cc0000', // EDIT: Delete button border
                      padding: '10px 15px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      letterSpacing: '0.5px'
                    }}
                  >
                    DELETE FOLDER {/* EDIT: Delete button text */}
                  </button>

                  {/* CANCEL BUTTON */}
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingFolder(null)
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent', // EDIT: Cancel button background
                      color: '#666666', // EDIT: Cancel button text color
                      border: '1px solid #cccccc', // EDIT: Cancel button border
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: 'normal',
                      cursor: 'pointer',
                      letterSpacing: '0.5px'
                    }}
                  >
                    CANCEL {/* EDIT: Cancel button text */}
                  </button>

                  {/* SAVE BUTTON */}
                  <button
                    onClick={updateFolder}
                    disabled={updating}
                    style={{
                      flex: 1,
                      backgroundColor: updating ? '#cccccc' : '#000000', // EDIT: Save button colors
                      color: updating ? '#666666' : '#ffffff', // EDIT: Save button text colors
                      border: `1px solid ${updating ? '#cccccc' : '#000000'}`,
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {updating ? 'SAVING...' : 'SAVE CHANGES'} {/* EDIT: Save button text */}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* CSS Animation for loading spinner + Custom scrollbar + Responsive Styles */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* EDIT: Custom scrollbar styling for horizontal scroll */
        div::-webkit-scrollbar {
          height: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #cccccc;
          border-radius: 4px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #999999;
        }

        /* EDIT: Responsive breakpoints for mobile devices */
        @media (max-width: 768px) {
          .header-container {
            padding: 20px 20px 15px 20px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 20px !important;
          }
          
          .nav-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 15px !important;
            width: 100% !important;
          }
          
          .nav-menu {
            gap: 15px !important;
            flex-wrap: wrap !important;
          }
          
          .collections-container {
            padding: 0 20px !important;
          }
          
          .folder-card {
            min-width: 280px !important;
            max-width: 280px !important;
          }
          
          .footer-container {
            padding: 0 20px !important;
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          
          .center-title {
            margin: 40px 0 30px 0 !important;
          }
        }

        @media (max-width: 480px) {
          .header-container {
            padding: 15px 15px 10px 15px !important;
          }
          
          .website-title {
            font-size: 16px !important;
          }
          
          .website-subtitle {
            font-size: 16px !important;
          }
          
          .nav-menu {
            font-size: 11px !important;
          }
          
          .collections-container {
            padding: 0 15px !important;
          }
          
          .folder-card {
            min-width: 260px !important;
            max-width: 260px !important;
          }
          
          .footer-container {
            padding: 0 15px !important;
            margin: 60px auto 40px auto !important;
          }
          
          .center-title {
            font-size: 20px !important;
            margin: 30px 0 25px 0 !important;
          }
        }
      `}</style>
    </div>
  )
}