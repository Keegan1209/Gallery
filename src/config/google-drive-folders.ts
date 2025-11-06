// Google Drive Folders Configuration
// Add the Google Drive folder IDs you want to display in your diary
// To get a folder ID: Open the folder in Google Drive, copy the ID from the URL
// Example: https://drive.google.com/drive/folders/1ABC123XYZ -> ID is "1ABC123XYZ"

interface FolderConfig {
  id: string
  displayName?: string
  description?: string
}

export const SELECTED_FOLDERS: FolderConfig[] = [
  // All folders now come from database via "Add Folder" feature
  // No hardcoded folders - everything is dynamic
]

// Alternative: If you want to use folder names instead of IDs
// The system will search for folders with these exact names
export const SELECTED_FOLDER_NAMES: string[] = [
  // Add exact folder names here (must match exactly)
  // "My Vacation Photos",
  // "Family Events",
  // "Wedding 2024"
]