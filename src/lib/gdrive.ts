/**
 * Convert Google Drive sharing URLs to direct image URLs.
 * Switched to high-performance lh3 engine for maximum reliability.
 */
export function toDirectImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  
  const cleanUrl = url.trim();

  // Pattern detection for all Google Drive formats
  const driveMatch = cleanUrl.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|googledrive\.com\/host\/)([^/?&#]+)/);
  
  if (driveMatch) {
    const id = driveMatch[1];
    // This endpoint (Fife) is used by Google Photos/Drive internally and bypasses most Referrer blocks
    return `https://lh3.googleusercontent.com/d/${id}`;
  }

  // Dropbox direct link transformation
  if (cleanUrl.includes("dropbox.com") && cleanUrl.includes("dl=0")) {
    return cleanUrl.replace("dl=0", "raw=1");
  }

  return cleanUrl;
}
