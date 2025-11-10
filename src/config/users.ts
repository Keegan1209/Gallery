/**
 * USER CONFIGURATION
 * 
 * Map email addresses to display names for diary entries
 * 
 * INSTRUCTIONS:
 * 1. Add your users here with their email and display name
 * 2. The email should match the login email
 * 3. The display name will appear next to diary entries
 */

export const USER_NAMES: Record<string, string> = {
  // Add your users here:

  'lillyluest@icloud.com': 'Lilly',
  'keeganlfrank@gmail.com': 'Keegan',

}

/**
 * Get display name for a user email
 */
export function getUserDisplayName(email: string): string {
  return USER_NAMES[email] || email.split('@')[0]
}
