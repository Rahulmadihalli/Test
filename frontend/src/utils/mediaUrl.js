/**
 * Resolves a media URL to the full backend URL
 */
export function resolveMediaUrl(mediaUrl) {
  if (!mediaUrl) {
    return mediaUrl;
  }

  // If it's already a full URL, return as is
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    return mediaUrl;
  }

  // Get the backend base URL (remove /api if present)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://mehandibackend.vercel.app/api";
  const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
  
  // Ensure mediaUrl starts with /
  const normalizedUrl = mediaUrl.startsWith("/") ? mediaUrl : `/${mediaUrl}`;
  
  const resolvedUrl = `${backendBaseUrl}${normalizedUrl}`;
  console.log(`[MediaURL] Resolved ${mediaUrl} to ${resolvedUrl}`);
  
  return resolvedUrl;
}

