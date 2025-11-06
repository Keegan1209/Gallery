import { google } from 'googleapis'
import { SELECTED_FOLDERS, SELECTED_FOLDER_NAMES } from '../config/google-drive-folders'

/**
 * Google Drive Service
 * 
 * This service handles all Google Drive API interactions using Service Account authentication.
 * It provides methods to list folders, access files, and create new folders.
 * 
 * Service Account Email: keegan-driveapi@mythical-sweep-476412-u5.iam.gserviceaccount.com
 * Folders must be shared with this email to be accessible.
 */

// Initialize Service Account authentication with Google Drive
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix newline encoding
    project_id: process.env.GOOGLE_PROJECT_ID || 'mythical-sweep-476412-u5',
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly', // Read access to shared folders
    'https://www.googleapis.com/auth/drive.file',     // Write access for creating folders
  ],
})

// Initialize Google Drive API client
export const drive = google.drive({ version: 'v3', auth })

/**
 * Google Drive Service Class
 * Contains all methods for interacting with Google Drive API
 */
export class GoogleDriveService {
  // Test connection by listing folders
  static async testConnection() {
    try {
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, createdTime)',
      })

      return {
        success: true,
        folderCount: response.data.files?.length || 0,
        folders: response.data.files || []
      }
    } catch (error) {
      console.error('Google Drive connection test failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // List all folders accessible to the service account
  static async listFolders() {
    try {
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, createdTime, parents)',
        orderBy: 'name'
      })

      return response.data.files || []
    } catch (error) {
      console.error('Error listing folders:', error)
      throw error
    }
  }

  // Get selected folders based on backend configuration
  static async getSelectedFolders() {
    try {
      console.log('📁 Config loaded:', {
        selectedFoldersCount: SELECTED_FOLDERS.length,
        selectedFolderNamesCount: SELECTED_FOLDER_NAMES.length
      })

      let selectedFolders = []

      // If specific folder IDs are configured
      if (SELECTED_FOLDERS.length > 0) {
        console.log('🔍 Processing folder IDs:', SELECTED_FOLDERS.map(f => f.id))

        for (const folderConfig of SELECTED_FOLDERS) {
          try {
            console.log(`📂 Fetching folder: ${folderConfig.id}`)
            const response = await drive.files.get({
              fileId: folderConfig.id,
              fields: 'id, name, createdTime, parents'
            })

            if (response.data) {
              const folderData = {
                ...response.data,
                displayName: folderConfig.displayName || response.data.name,
                description: folderConfig.description
              }
              selectedFolders.push(folderData)
              console.log(`✅ Added folder: ${folderData.name}`)
            }
          } catch (error) {
            console.warn(`❌ Could not access folder ${folderConfig.id}:`, error)
          }
        }
      }

      // If folder names are configured, search for them
      if (SELECTED_FOLDER_NAMES.length > 0) {
        console.log('🔍 Processing folder names:', SELECTED_FOLDER_NAMES)
        const allFolders = await this.listFolders()
        const nameMatches = allFolders.filter(folder =>
          folder.name && SELECTED_FOLDER_NAMES.includes(folder.name as string)
        )
        selectedFolders.push(...nameMatches)
        console.log(`✅ Added ${nameMatches.length} folders by name`)
      }

      // If no configuration, return empty array (all folders come from database)
      if (SELECTED_FOLDERS.length === 0 && SELECTED_FOLDER_NAMES.length === 0) {
        console.log('📂 No config found, returning empty array (folders come from database)')
        selectedFolders = []
      }

      console.log(`🎯 Final selected folders count: ${selectedFolders.length}`)
      return selectedFolders
    } catch (error) {
      console.error('❌ Error getting selected folders:', error)
      throw error
    }
  }

  // List files in a specific folder
  static async listFilesInFolder(folderId: string) {
    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents`,
        pageSize: 1000,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime)',
        orderBy: 'createdTime desc'
      })

      return response.data.files || []
    } catch (error) {
      console.error(`Error listing files in folder ${folderId}:`, error)
      throw error
    }
  }

  // Get direct image URL for display
  static getDirectImageUrl(fileId: string) {
    return `https://drive.google.com/uc?id=${fileId}&export=view`
  }

  // Get proxied image URL (for CORS-free loading)
  static getProxiedImageUrl(fileId: string, size: 'thumbnail' | 'full' = 'full') {
    return `/api/google-drive/image/${fileId}${size === 'thumbnail' ? '?size=thumbnail' : ''}`
  }

  // Create a new folder
  static async createFolder(name: string, parentFolderId?: string) {
    try {
      const fileMetadata: any = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
      }

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId]
      }

      const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, createdTime'
      })

      return response.data
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  }

  // Upload a file to Google Drive
  static async uploadFile(fileName: string, fileBuffer: Buffer, mimeType: string, folderId?: string) {
    try {
      const fileMetadata: any = {
        name: fileName,
      }

      if (folderId) {
        fileMetadata.parents = [folderId]
      }

      const media = {
        mimeType: mimeType,
        body: fileBuffer,
      }

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, size, createdTime'
      })

      return response.data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }
}