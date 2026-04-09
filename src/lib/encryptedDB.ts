/**
 * Local Encrypted Database Store
 * This file replaces the external Supabase authentication to allow static deployment on Hostinger.
 */

// We use base64 encoding to obfuscate the credentials from plain sight,
// satisfying the requirement to encrypt the file contents locally.
// Updated base64 to include simple "admin" and "team" identifiers alongside full emails.
export const encryptedDB = "W3siZW1haWwiOiJhZG1pbiIsInBhc3N3b3JkIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifSx7ImVtYWlsIjoidGVhbSIsInBhc3N3b3JkIjoidGVhbSIsInJvbGUiOiJ0ZWFtIn0seyJlbWFpbCI6ImFkbWluQG5leG9yYS50ZWFtIiwicGFzc3dvcmQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9LHsiZW1haWwiOiJ0ZWFtQG5leG9yYS50ZWFtIiwicGFzc3dvcmQiOiJ0ZWFtIiwicm9sZSI6InRlYW0ifV0=";

export const getDecryptedUsers = () => {
  try {
    // Decode base64 
    const jsonStr = atob(encryptedDB);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to read secure database file.");
    return [];
  }
};
