/**
 * Extract port numbers from conversation events.
 *
 * This utility scans agent messages and terminal output for port mentions
 * like "localhost:3456", "running on port 3000", "http://127.0.0.1:8080", etc.
 *
 * Used by useUnifiedActiveHost to dynamically detect which ports the
 * dev server is running on, without requiring hardcoded port lists.
 */

import { OHEvent } from "#/stores/use-event-store";
import {
  isV1Event,
  isObservationEvent,
  isMessageEvent,
} from "#/types/v1/type-guards";

// Common dev server ports to prioritize (higher priority = checked first)
const PRIORITY_PORTS = new Set([
  3000, 3001, 3002, 3456, 4000, 4173, 5173, 5174, 5175, 8000, 8080, 8888, 9000,
]);

// Ports that are definitely NOT web servers (skip these)
const EXCLUDED_PORTS = new Set([
  22, // SSH
  80, // HTTP (usually external)
  443, // HTTPS (usually external)
  8001, // OpenHands agent server
]);

/**
 * Regex patterns to extract ports from text.
 * Order matters - more specific patterns first.
 */
const PORT_PATTERNS = [
  // localhost:PORT or 127.0.0.1:PORT
  /(?:localhost|127\.0\.0\.1):(\d{2,5})/gi,
  // http://...:PORT/
  /https?:\/\/[^/:]+:(\d{2,5})/gi,
  // "running on port 3000" or "listening on port 8080"
  /(?:running|listening|serving|started|available)\s+(?:on|at)\s+port\s+(\d{2,5})/gi,
  // "port 3000" in various contexts
  /\bport\s+(\d{2,5})\b/gi,
  // Dev server output like "-> Local: http://localhost:5173/"
  /Local:\s*https?:\/\/[^/:]+:(\d{2,5})/gi,
  // Vite/Next.js style "ready in X ms at http://localhost:PORT"
  /at\s+https?:\/\/[^/:]+:(\d{2,5})/gi,
];

/**
 * Extract text content from a V1 event.
 */
function getEventTextContent(event: OHEvent): string[] {
  const texts: string[] = [];

  if (!isV1Event(event)) {
    // V0 event - check message and content fields
    if ("message" in event && typeof event.message === "string") {
      texts.push(event.message);
    }
    if ("content" in event && typeof event.content === "string") {
      texts.push(event.content);
    }
    return texts;
  }

  // V1 message event - extract from llm_message.content
  if (isMessageEvent(event)) {
    for (const content of event.llm_message.content) {
      if (content.type === "text" && content.text) {
        texts.push(content.text);
      }
    }
  }

  // V1 observation event - extract from observation.content
  if (isObservationEvent(event) && Array.isArray(event.observation.content)) {
    for (const content of event.observation.content) {
      if (
        content &&
        typeof content === "object" &&
        "type" in content &&
        content.type === "text" &&
        "text" in content &&
        typeof content.text === "string"
      ) {
        texts.push(content.text);
      }
    }
  }

  return texts;
}

/**
 * Extract unique port numbers from text using regex patterns.
 */
function extractPortsFromText(text: string): Set<number> {
  const ports = new Set<number>();

  for (const pattern of PORT_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match !== null) {
      const port = parseInt(match[1], 10);
      // Only include reasonable dev server ports (1024-65535, not excluded)
      if (port >= 1024 && port <= 65535 && !EXCLUDED_PORTS.has(port)) {
        ports.add(port);
      }
      match = pattern.exec(text);
    }
  }

  return ports;
}

/**
 * Extract port numbers from conversation events.
 *
 * @param events - Array of conversation events
 * @param limit - Maximum number of recent events to scan (default: 50)
 * @returns Array of unique port numbers, sorted by priority
 */
export function extractPortsFromEvents(
  events: OHEvent[],
  limit: number = 50,
): number[] {
  const allPorts = new Set<number>();

  // Scan most recent events first (they're more likely to have current port info)
  const recentEvents = events.slice(-limit);

  for (const event of recentEvents) {
    const texts = getEventTextContent(event);
    for (const text of texts) {
      const ports = extractPortsFromText(text);
      ports.forEach((port) => allPorts.add(port));
    }
  }

  // Sort by priority: PRIORITY_PORTS first, then by port number
  return Array.from(allPorts).sort((a, b) => {
    const aPriority = PRIORITY_PORTS.has(a) ? 0 : 1;
    const bPriority = PRIORITY_PORTS.has(b) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a - b;
  });
}
