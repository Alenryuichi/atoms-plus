/**
 * Gets the backend base host from environment or window.location
 * @returns Backend host (e.g., "openhands-production.up.railway.app")
 */
function getBackendHost(): string {
  // Use VITE_BACKEND_BASE_URL if available, otherwise fall back to window.location.host
  return import.meta.env.VITE_BACKEND_BASE_URL || window.location.host;
}

/**
 * Extracts the base host from conversation URL
 * @param conversationUrl The conversation URL containing host/port (e.g., "http://localhost:3000/api/conversations/123")
 * @returns Base host (e.g., "localhost:3000") or backend host as fallback
 */
export function extractBaseHost(
  conversationUrl: string | null | undefined,
): string {
  if (conversationUrl && !conversationUrl.startsWith("/")) {
    try {
      const url = new URL(conversationUrl);
      return url.host; // e.g., "localhost:3000"
    } catch {
      return getBackendHost();
    }
  }
  // For relative URLs (e.g., /runtime/8000/...), use the backend host
  return getBackendHost();
}

/**
 * Extracts the path prefix from conversation URL (everything before /api/conversations)
 * This is needed for proxy deployments where agent-servers are accessed via paths like /runtime/{port}/
 * @param conversationUrl The conversation URL (e.g., "http://localhost:3000/runtime/55313/api/conversations/123" or "/runtime/8000/api/conversations/123")
 * @returns Path prefix without trailing slash (e.g., "/runtime/55313") or empty string
 */
export function extractPathPrefix(
  conversationUrl: string | null | undefined,
): string {
  if (!conversationUrl) {
    return "";
  }

  // Handle relative URLs (e.g., "/runtime/8000/api/conversations/123")
  if (conversationUrl.startsWith("/")) {
    const pathBeforeApi = conversationUrl.split("/api/conversations")[0] || "";
    return pathBeforeApi.replace(/\/$/, ""); // Remove trailing slash
  }

  // Handle absolute URLs
  try {
    const url = new URL(conversationUrl);
    const pathBeforeApi = url.pathname.split("/api/conversations")[0] || "";
    return pathBeforeApi.replace(/\/$/, ""); // Remove trailing slash
  } catch {
    return "";
  }
}

/**
 * Builds the HTTP base URL for V1 API calls
 * @param conversationUrl The conversation URL containing host/port
 * @returns HTTP base URL (e.g., "http://localhost:3000" or "http://localhost:3000/runtime/55313")
 */
export function buildHttpBaseUrl(
  conversationUrl: string | null | undefined,
): string {
  const baseHost = extractBaseHost(conversationUrl);
  const pathPrefix = extractPathPrefix(conversationUrl);
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${baseHost}${pathPrefix}`;
}

/**
 * Builds the WebSocket URL for V1 conversations (without query params)
 * @param conversationId The conversation ID
 * @param conversationUrl The conversation URL containing host/port (e.g., "http://localhost:3000/api/conversations/123")
 * @returns WebSocket URL or null if inputs are invalid
 */
export function buildWebSocketUrl(
  conversationId: string | undefined,
  conversationUrl: string | null | undefined,
): string | null {
  if (!conversationId) {
    return null;
  }

  const baseHost = extractBaseHost(conversationUrl);
  const pathPrefix = extractPathPrefix(conversationUrl);

  // Build WebSocket URL: ws://host:port[/path-prefix]/sockets/events/{conversationId}
  // The path prefix (e.g., /runtime/55313) is needed for proxy deployments
  // Note: Query params should be passed via the useWebSocket hook options
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${baseHost}${pathPrefix}/sockets/events/${conversationId}`;
}
