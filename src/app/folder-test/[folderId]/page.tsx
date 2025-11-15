'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getUserDisplayName } from '@/config/users'

// TypeScript interface for photo data structure
interface Photo {
  id: string
  name: string
  mimeType: string
  createdTime: string
  thumbnailUrl: string
  fullUrl: string
  isVideo: boolean
  isImage: boolean
}

interface DiaryEntry {
  id: string
  content: string
  created_at: string
  user_email: string
}

export default function FolderTestPage() {
  const router = useRouter()
  const params = useParams()
  const folderId = params.folderId as string

  const [activeTab, setActiveTab] = useState<'photos' | 'diary'>('photos')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)
  const [folderName, setFolderName] = useState<string>('')
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [newEntryContent, setNewEntryContent] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  useEffect(() => {
    if (folderId) {
      fetchPhotos()
      loadDiaryEntry()
    }
  }, [folderId])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/google-drive/folders/${folderId}/photos`)
      const data = await response.json()

      if (data.success) {
        setPhotos(data.photos)
        setFolderName(decodeURIComponent(new URLSearchParams(window.location.search).get('name') || 'Photo Collection'))
      } else {
        setError(data.message || 'Failed to load photos')
      }
    } catch (error) {
      setError('Error loading photos')
    } finally {
      setLoading(false)
    }
  }

  const loadDiaryEntry = async () => {
    try {
      const response = await fetch(`/api/folders/${folderId}/diary`)
      if (response.ok) {
        const data = await response.json()
        setDiaryEntries(data.entries || [])
      }
    } catch (error) {
      console.log('No existing diary entries found')
    }
  }

  const saveNewEntry = async () => {
    if (!newEntryContent.trim()) return
    
    try {
      setIsSaving(true)
      const response = await fetch(`/api/folders/${folderId}/diary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newEntryContent }),
      })

      if (!response.ok) {
        throw new Error('Failed to save diary entry')
      }

      const data = await response.json()
      setDiaryEntries([...diaryEntries, data.entry])
      setNewEntryContent('')
    } catch (error) {
      console.error('Error saving diary entry:', error)
      alert('Failed to save entry')
    } finally {
      setIsSaving(false)
    }
  }

  const updateEntry = async (entryId: string, content: string) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/folders/${folderId}/diary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entryId, content }),
      })

      if (!response.ok) {
        throw new Error('Failed to update diary entry')
      }

      const data = await response.json()
      setDiaryEntries(diaryEntries.map(e => e.id === entryId ? data.entry : e))
      setEditingEntryId(null)
    } catch (error) {
      console.error('Error updating diary entry:', error)
      alert('Failed to update entry')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return
    
    try {
      const response = await fetch(`/api/folders/${folderId}/diary`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entryId }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete diary entry')
      }

      setDiaryEntries(diaryEntries.filter(e => e.id !== entryId))
    } catch (error) {
      console.error('Error deleting diary entry:', error)
      alert('Failed to delete entry')
    }
  }

  const openLightbox = (index: number) => {
    setSelectedPhoto(index)
  }

  const closeLightbox = () => {
    setSelectedPhoto(null)
  }

  const nextPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1)
    }
  }

  const prevPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhoto === null) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextPhoto()
      if (e.key === 'ArrowLeft') prevPhoto()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhoto])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'Helvetica, Arial, sans-serif'
    }}>
      {/* Sticky Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        {/* Back Button - Left */}
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '12px',
            color: '#666666',
            cursor: 'pointer',
            fontFamily: 'Helvetica, Arial, sans-serif',
            letterSpacing: '0.5px',
            padding: 0
          }}
        >
          ← BACK
        </button>

        {/* Folder Name - Center */}
        <h1 style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '16px',
          fontWeight: 'normal',
          color: '#000000',
          margin: 0,
          letterSpacing: '1px'
        }}>
          {folderName.toUpperCase()}
        </h1>

        {/* Spacer for layout balance */}
        <div style={{ width: '60px' }}></div>
      </nav>

      {/* Tabs - Visible on all screen sizes */}
      <div style={{
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 40px'
        }}>
          <button
            onClick={() => setActiveTab('photos')}
            style={{
              flex: 1,
              padding: '15px',
              fontSize: '12px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 'normal',
              color: activeTab === 'photos' ? '#000000' : '#999999',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'photos' ? '2px solid #000000' : '2px solid transparent',
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            PHOTOS ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('diary')}
            style={{
              flex: 1,
              padding: '15px',
              fontSize: '12px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 'normal',
              color: activeTab === 'diary' ? '#000000' : '#999999',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'diary' ? '2px solid #000000' : '2px solid transparent',
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            DIARY ({diaryEntries.length})
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '20px'
      }}
      className="main-content">
        {/* Photo Gallery Section */}
        <div className="photos-section" style={{
          display: activeTab === 'photos' ? 'block' : 'none'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999999',
              fontSize: '14px'
            }}>
              Loading photos...
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#cc0000',
              fontSize: '14px'
            }}>
              {error}
            </div>
          ) : photos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999999',
              fontSize: '14px'
            }}>
              No photos found in this folder
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0px'
            }}
            className="photo-grid">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => openLightbox(index)}
                  style={{
                    aspectRatio: '1/1',
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer',
                    backgroundImage: `url(${photo.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {photo.isVideo && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderRadius: '50%',
                      padding: '10px',
                      color: '#ffffff',
                      fontSize: '20px'
                    }}>
                      ▶️
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diary Section - Centered and Wider */}
        <div className="diary-section" style={{
          display: activeTab === 'diary' ? 'flex' : 'none',
          flexDirection: 'column',
          maxWidth: '1100px',
          margin: '0 auto',
          height: 'calc(100vh - 200px)'
        }}>
          {/* Messages Container */}
          <div 
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: '#ffffff',
              marginBottom: '20px',
              border: '1px solid #e0e0e0'
            }}
            className="diary-entries-scroll">
              {diaryEntries.length === 0 ? (
                <p style={{
                  fontSize: '12px',
                  color: '#999999',
                  textAlign: 'center',
                  padding: '40px 20px'
                }}>
                  No diary entries yet. Add your first memory below.
                </p>
              ) : (
                diaryEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      paddingBottom: '20px',
                      marginBottom: '20px',
                      backgroundColor: '#ffffff',
                      borderBottom: '1px solid #e0e0e0'
                    }}
                  >
                    {/* Header - User and Date */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#000000',
                        letterSpacing: '0.5px'
                      }}>
                        {getUserDisplayName(entry.user_email).toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: '#999999',
                        letterSpacing: '0.3px'
                      }}>
                        {new Date(entry.created_at).toLocaleDateString()} • {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Message Content - Editable or Display */}
                    {editingEntryId === entry.id ? (
                      <div>
                        <textarea
                          defaultValue={entry.content}
                          id={`edit-${entry.id}`}
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            fontSize: '12px',
                            fontFamily: 'Helvetica, Arial, sans-serif',
                            color: '#000000',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e0e0e0',
                            outline: 'none',
                            resize: 'vertical',
                            marginBottom: '10px',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <span
                            onClick={() => {
                              const textarea = document.getElementById(`edit-${entry.id}`) as HTMLTextAreaElement
                              updateEntry(entry.id, textarea.value)
                            }}
                            style={{
                              fontSize: '10px',
                              color: '#000000',
                              cursor: 'pointer',
                              letterSpacing: '0.3px'
                            }}
                          >
                            save
                          </span>
                          <span
                            onClick={() => deleteEntry(entry.id)}
                            style={{
                              fontSize: '10px',
                              color: '#cc0000',
                              cursor: 'pointer',
                              letterSpacing: '0.3px'
                            }}
                          >
                            delete
                          </span>
                          <span
                            onClick={() => setEditingEntryId(null)}
                            style={{
                              fontSize: '10px',
                              color: '#999999',
                              cursor: 'pointer',
                              letterSpacing: '0.3px'
                            }}
                          >
                            cancel
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{
                          fontSize: '12px',
                          color: '#333333',
                          lineHeight: '1.6',
                          margin: 0,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {entry.content}
                        </p>

                        {/* Edit Link */}
                        <div style={{
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px solid #f0f0f0'
                        }}>
                          <span
                            onClick={() => setEditingEntryId(entry.id)}
                            style={{
                              fontSize: '10px',
                              color: '#999999',
                              cursor: 'pointer',
                              letterSpacing: '0.3px'
                            }}
                          >
                            edit
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

          {/* New Message Input */}
          <div>
            <textarea
              value={newEntryContent}
              onChange={(e) => setNewEntryContent(e.target.value)}
              placeholder="Add a new memory..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                fontSize: '12px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: '#000000',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                outline: 'none',
                resize: 'vertical',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={saveNewEntry}
              disabled={isSaving || !newEntryContent.trim()}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '11px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 'normal',
                color: '#ffffff',
                backgroundColor: '#000000',
                border: '1px solid #000000',
                cursor: isSaving || !newEntryContent.trim() ? 'not-allowed' : 'pointer',
                letterSpacing: '0.5px',
                opacity: isSaving || !newEntryContent.trim() ? 0.5 : 1
              }}
            >
              {isSaving ? 'SAVING...' : 'ADD ENTRY'}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for Full-Size Photos */}
      {selectedPhoto !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '24px',
              zIndex: 1001
            }}
          >
            <X size={32} />
          </button>

          {/* Previous Button */}
          {selectedPhoto > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevPhoto()
              }}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '24px',
                zIndex: 1001
              }}
            >
              <ChevronLeft size={48} />
            </button>
          )}

          {/* Next Button */}
          {selectedPhoto < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextPhoto()
              }}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '24px',
                zIndex: 1001
              }}
            >
              <ChevronRight size={48} />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[selectedPhoto].fullUrl}
            alt={photos[selectedPhoto].name}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

      {/* Responsive Styles */}
      <style jsx global>{`
        /* Hide scrollbar for diary entries */
        .diary-entries-scroll::-webkit-scrollbar {
          display: none;
        }
        .diary-entries-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Responsive photo grid */
        @media (max-width: 1200px) {
          .photo-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 900px) {
          .photo-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .main-content {
            padding: 20px !important;
          }
          .diary-section {
            max-width: 100% !important;
            height: auto !important;
            min-height: 60vh !important;
          }
        }
      `}</style>
    </div>
  )
}
