'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { performanceMonitor } from '@/lib/performance-monitor'

// TypeScript interface for photo data structure
interface Photo {
  id: string
  name: string
  mimeType: string
  createdTime: string
  thumbnailUrl: string // Proxied URL for thumbnail display
  fullUrl: string      // Proxied URL for full-size display
  isVideo: boolean
  isImage: boolean
}

// Lazy loading image component with intersection observer
interface LazyImageProps {
  src: string
  alt: string
  className: string
  onError: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onClick: () => void
  isVideo?: boolean
}

function LazyImage({ src, alt, className, onError, onClick, isVideo }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={imgRef}
      className={className}
      onClick={onClick}
    >
      {isInView && (
        <>
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            loading="lazy"
            onLoad={() => {
              setIsLoaded(true)
              performanceMonitor.endTimer(`thumbnail-${src}`)
            }}
            onError={onError}
            onLoadStart={() => {
              performanceMonitor.startTimer(`thumbnail-${src}`, 'thumbnail')
            }}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
          )}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 rounded-full p-2">
                <span className="text-white text-xl">▶️</span>
              </div>
            </div>
          )}
        </>
      )}
      {!isInView && (
        <div className="w-full h-full bg-gray-200 animate-pulse"></div>
      )}
    </div>
  )
}

/**
 * Photo Gallery Page
 * 
 * Displays all photos from a specific Google Drive folder in a grid layout.
 * Features:
 * - Responsive grid (5 columns)
 * - Click to enlarge with lightbox
 * - Keyboard navigation (arrow keys, escape)
 * - Images loaded via proxy to avoid CORS issues
 * 
 * Route: /folder/[folderId]
 */
export default function FolderPhotosPage() {
  const router = useRouter()
  const params = useParams()
  const folderId = params.folderId as string

  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)
  const [folderName, setFolderName] = useState<string>('')
  const [imageCache, setImageCache] = useState<Set<string>>(new Set())
  const [diaryEntry, setDiaryEntry] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    if (folderId) {
      fetchPhotos()
      loadDiaryEntry()
    }
  }, [folderId])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      performanceMonitor.startTimer('photos-api', 'api-call')

      const response = await fetch(`/api/google-drive/folders/${folderId}/photos`)
      const data = await response.json()

      performanceMonitor.endTimer('photos-api')

      if (data.success) {
        setPhotos(data.photos)
        // Try to get folder name from URL params or set a default
        setFolderName(decodeURIComponent(new URLSearchParams(window.location.search).get('name') || 'Photo Collection'))

        // Log performance summary in development
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => performanceMonitor.logSummary(), 2000)
        }
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
        setDiaryEntry(data.content || '')
      }
    } catch (error) {
      console.log('No existing diary entry found')
    }
  }

  const saveDiaryEntry = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/folders/${folderId}/diary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: diaryEntry }),
      })

      if (!response.ok) {
        throw new Error('Failed to save diary entry')
      }

      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving diary entry:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDiaryEntry(e.target.value)
  }

  // Auto-save functionality with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (diaryEntry.trim() !== '') {
        saveDiaryEntry()
      }
    }, 2000) // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timeoutId)
  }, [diaryEntry])

  const openLightbox = (index: number) => {
    setSelectedPhoto(index)
    // Preload adjacent images for smoother navigation
    preloadAdjacentImages(index)
  }

  const preloadAdjacentImages = useCallback((currentIndex: number) => {
    const preloadImage = (index: number) => {
      if (index >= 0 && index < photos.length && !imageCache.has(photos[index].fullUrl)) {
        const img = new Image()
        img.src = photos[index].fullUrl
        img.onload = () => {
          setImageCache(prev => new Set(prev).add(photos[index].fullUrl))
        }
      }
    }

    // Preload current, next, and previous images
    preloadImage(currentIndex)
    preloadImage(currentIndex + 1)
    preloadImage(currentIndex - 1)
  }, [photos, imageCache])

  const closeLightbox = () => {
    setSelectedPhoto(null)
  }

  const nextPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      const newIndex = selectedPhoto + 1
      setSelectedPhoto(newIndex)
      preloadAdjacentImages(newIndex)
    }
  }

  const prevPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      const newIndex = selectedPhoto - 1
      setSelectedPhoto(newIndex)
      preloadAdjacentImages(newIndex)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedPhoto !== null) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextPhoto()
      if (e.key === 'ArrowLeft') prevPhoto()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhoto])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading photos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Photo Gallery
            </h1>
          </div>
        </div>
      </nav>

      {/* Diary Entry Section */}
      <section className="bg-white border-b border-gray-200" style={{ height: '40vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-full">
            {/* Left Column - Folder Name (30%) */}
            <div className="w-3/12 pr-6 py-6 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{folderName}</h2>
              <p className="text-sm text-gray-500">{photos.length} photos</p>
              <div className="mt-4">
                <button
                  onClick={saveDiaryEntry}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Entry'}
                </button>
                {lastSaved && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Diary Entry (70%) */}
            <div className="w-9/12 pl-6 py-6">
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="diary-entry" className="block text-sm font-medium text-gray-700">
                    Diary Entry
                  </label>
                  <span className="text-xs text-gray-500">
                    {diaryEntry.length} characters
                  </span>
                </div>
                <textarea
                  id="diary-entry"
                  value={diaryEntry}
                  onChange={handleDiaryChange}
                  placeholder="Write about this collection of memories... Share your thoughts, feelings, and stories about these photos."
                  className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 overflow-y-auto"
                  style={{ minHeight: 'calc(40vh - 100px)' }}
                />
                {isSaving && (
                  <div className="mt-2 text-xs text-indigo-600 flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600 mr-2"></div>
                    Auto-saving...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Grid */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">📷</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Photos Found</h3>
            <p className="text-gray-600">This folder doesn't contain any images or videos.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-4">
              {photos.map((photo, index) => (
                <LazyImage
                  key={photo.id}
                  src={photo.thumbnailUrl}
                  alt=""
                  className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group relative"
                  onClick={() => openLightbox(index)}
                  onError={(e) => {
                    // Log the error for debugging
                    console.log(`❌ Image failed to load: ${photo.thumbnailUrl}`)
                    
                    // Try the full URL as fallback
                    const target = e.target as HTMLImageElement
                    if (target.src === photo.thumbnailUrl) {
                      console.log(`🔄 Trying full URL as fallback: ${photo.fullUrl}`)
                      target.src = photo.fullUrl
                    } else {
                      // If both fail, show a better placeholder
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1IiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+'
                      target.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  isVideo={photo.isVideo}
                />
              ))}
            </div>

            {/* Performance tip */}
            {/* <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <div className="text-blue-600 mr-3">💡</div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Performance Optimized</h4>
                  <p className="text-sm text-blue-700">
                    Images load progressively as you scroll and are cached for faster viewing.
                    Thumbnails are optimized for quick loading.
                  </p>
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-blue-600 mt-2">
                      Dev: {imageCache.size} images cached • Check console for performance metrics
                    </p>
                  )}
                </div>
              </div>
            </div> */}
          </>
        )}
      </main>

      {/* Lightbox */}
      {selectedPhoto !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Navigation Buttons */}
            {selectedPhoto > 0 && (
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
              >
                <ChevronLeft className="h-12 w-12" />
              </button>
            )}

            {selectedPhoto < photos.length - 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
              >
                <ChevronRight className="h-12 w-12" />
              </button>
            )}

            {/* Photo */}
            <img
              src={photos[selectedPhoto].fullUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
              style={{
                filter: imageCache.has(photos[selectedPhoto].fullUrl) ? 'none' : 'blur(2px)',
                transition: 'filter 0.3s ease'
              }}
              onLoad={() => {
                setImageCache(prev => new Set(prev).add(photos[selectedPhoto].fullUrl))
              }}
            />

            {/* Photo Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              {selectedPhoto + 1} of {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}