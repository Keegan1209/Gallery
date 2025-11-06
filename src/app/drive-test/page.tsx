'use client'

import { useState } from 'react'

interface Folder {
  id: string
  name: string
  createdTime: string
  fileCount: number
  hasImages: boolean
  hasVideos: boolean
}

export default function DriveTestPage() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setTestResult('Testing connection...')
    
    try {
      const response = await fetch('/api/google-drive/test')
      const data = await response.json()
      
      if (data.success) {
        setTestResult(`✅ Connected! Found ${data.folderCount} folders`)
      } else {
        setTestResult(`❌ Failed: ${data.message}`)
      }
    } catch (error) {
      setTestResult('❌ Connection error')
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/google-drive/folders')
      const data = await response.json()
      
      if (data.success) {
        setFolders(data.folders)
        setTestResult(`✅ Loaded ${data.folders.length} folders`)
      } else {
        setTestResult(`❌ Failed to load folders: ${data.message}`)
      }
    } catch (error) {
      setTestResult('❌ Error loading folders')
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    
    setCreating(true)
    
    try {
      const response = await fetch('/api/google-drive/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim()
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTestResult(`✅ Created folder: ${data.folder.name}`)
        setNewFolderName('')
        // Reload folders to show the new one
        loadFolders()
      } else {
        setTestResult(`❌ Failed to create folder: ${data.message}`)
      }
    } catch (error) {
      setTestResult('❌ Error creating folder')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Google Drive API Test</h1>
        
        {/* Test Connection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md mr-4"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={loadFolders}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
          >
            {loading ? 'Loading...' : 'Load Folders'}
          </button>
          
          {testResult && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-sm font-mono">{testResult}</p>
            </div>
          )}
        </div>

        {/* Create Folder */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Folder</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <button
              onClick={createFolder}
              disabled={creating || !newFolderName.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              {creating ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </div>

        {/* Folders List */}
        {folders.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Google Drive Folders</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map((folder) => (
                <div key={folder.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{folder.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📁 {folder.fileCount} files</p>
                    {folder.hasImages && <p>🖼️ Contains images</p>}
                    {folder.hasVideos && <p>🎥 Contains videos</p>}
                    <p className="text-xs">Created: {new Date(folder.createdTime).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}