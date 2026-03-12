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
  isExecuteBashActionEvent,
  isExecuteBashObservationEvent,
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
  // local URLs with explicit port
  /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::(\d{2,5}))/gi,
  // "running on port 3000" or "listening on port 8080"
  /(?:running|listening|serving|started|available)\s+(?:on|at)\s+port\s+(\d{2,5})/gi,
  // "port 3000" in various contexts
  /\bport\s+(\d{2,5})\b/gi,
  // Dev server output like "-> Local: http://localhost:5173/"
  /Local:\s*https?:\/\/[^/:]+:(\d{2,5})/gi,
  // Vite/Next.js style "ready in X ms at http://localhost:PORT"
  /at\s+https?:\/\/[^/:]+:(\d{2,5})/gi,
];

export interface ExtractedPortCandidate {
  port: number;
  lastSeenEventIndex: number;
  isPriorityPort: boolean;
}

export interface ExtractedPreviewCandidate {
  previewUrl: string;
  port: number | null;
  lastSeenEventIndex: number;
}

const EXPLICIT_PREVIEW_PATTERNS = [
  /(?:页面预览地址|预览地址|preview\s*(?:url|address)?|app\s*url)\s*[:：]\s*(https?:\/\/[^\s"'`<>]+)/gi,
];

const LOCAL_URL_PATTERN =
  /https?:\/\/(?:localhost|127\.0\.0\.1)(?::(\d{2,5}))?(?:\/runtime\/(\d{2,5})\/?)?[^\s"'`<>]*/gi;

/**
 * Extract text content from a V1 event.
 */
function getEventTextContent(event: OHEvent): string[] {
  const texts: string[] = [];
  const maybePortSignal = (text: string): boolean =>
    /(localhost|127\.0\.0\.1|runtime\/\d+|preview|port\s+\d{2,5}|https?:\/\/)/i.test(
      text,
    );

  if (!isV1Event(event)) {
    // V0 run action - command may include explicit --port or localhost URL
    if (
      "action" in event &&
      event.action === "run" &&
      "args" in event &&
      event.args &&
      typeof event.args === "object" &&
      "command" in event.args &&
      typeof event.args.command === "string"
    ) {
      texts.push(event.args.command);
    }
    // V0 run observation - terminal output and extras.command carry server URLs.
    if (
      "observation" in event &&
      event.observation === "run" &&
      "content" in event &&
      typeof event.content === "string"
    ) {
      texts.push(event.content);
    }
    if (
      "observation" in event &&
      event.observation === "run" &&
      "extras" in event &&
      event.extras &&
      typeof event.extras === "object" &&
      "command" in event.extras &&
      typeof event.extras.command === "string"
    ) {
      texts.push(event.extras.command);
    }

    if ("message" in event && typeof event.message === "string") {
      if (maybePortSignal(event.message)) {
        texts.push(event.message);
      }
    }
    if ("content" in event && typeof event.content === "string") {
      if (maybePortSignal(event.content)) {
        texts.push(event.content);
      }
    }

    return texts;
  }

  // V1 message event - extract from llm_message.content
  if (isMessageEvent(event)) {
    for (const content of event.llm_message.content) {
      if (
        content.type === "text" &&
        content.text &&
        maybePortSignal(content.text)
      ) {
        texts.push(content.text);
      }
    }
  }

  // V1 terminal observations - extract command output only from run tools.
  if (
    isExecuteBashObservationEvent(event) &&
    Array.isArray(event.observation.content)
  ) {
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
    if (typeof event.observation.command === "string") {
      texts.push(event.observation.command);
    }
  }

  // V1 run action command can include explicit ports.
  if (isExecuteBashActionEvent(event) && event.action.command) {
    texts.push(event.action.command);
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
  return extractPortCandidatesFromEvents(events, limit).map(
    (candidate) => candidate.port,
  );
}

export function extractPortCandidatesFromEvents(
  events: OHEvent[],
  limit: number = 50,
): ExtractedPortCandidate[] {
  const portToLastSeen = new Map<number, number>();
  const recentEvents = events.slice(-limit);
  const startIndex = Math.max(events.length - recentEvents.length, 0);

  for (let i = 0; i < recentEvents.length; i += 1) {
    const event = recentEvents[i];
    const eventIndex = startIndex + i;
    const texts = getEventTextContent(event);
    for (const text of texts) {
      const ports = extractPortsFromText(text);
      ports.forEach((port) => {
        const lastSeen = portToLastSeen.get(port);
        if (lastSeen === undefined || eventIndex > lastSeen) {
          portToLastSeen.set(port, eventIndex);
        }
      });
    }
  }

  // Sort by recency first, then priority set, then port number.
  return Array.from(portToLastSeen.entries())
    .map(([port, lastSeenEventIndex]) => ({
      port,
      lastSeenEventIndex,
      isPriorityPort: PRIORITY_PORTS.has(port),
    }))
    .sort((a, b) => {
      if (a.lastSeenEventIndex !== b.lastSeenEventIndex) {
        return b.lastSeenEventIndex - a.lastSeenEventIndex;
      }
      if (a.isPriorityPort !== b.isPriorityPort) {
        return a.isPriorityPort ? -1 : 1;
      }
      return a.port - b.port;
    });
}

const normalizePreviewUrl = (url: string): string => {
  const trimmed = url.trim().replace(/[),.;]+$/g, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

const extractPreviewCandidatesFromText = (
  text: string,
): Array<{ previewUrl: string; port: number | null }> => {
  const candidates: Array<{ previewUrl: string; port: number | null }> = [];

  EXPLICIT_PREVIEW_PATTERNS.forEach((pattern) => {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match) {
      const previewUrl = normalizePreviewUrl(match[1] ?? "");
      const portMatch = previewUrl.match(/\/runtime\/(\d{2,5})\/?$/i);
      const port = portMatch ? Number.parseInt(portMatch[1], 10) : null;
      if (previewUrl) {
        candidates.push({ previewUrl, port });
      }
      match = pattern.exec(text);
    }
  });

  LOCAL_URL_PATTERN.lastIndex = 0;
  let localMatch = LOCAL_URL_PATTERN.exec(text);
  while (localMatch) {
    const previewUrl = normalizePreviewUrl(localMatch[0] ?? "");
    const runtimePort = localMatch[2]
      ? Number.parseInt(localMatch[2], 10)
      : null;
    const hostPort = localMatch[1] ? Number.parseInt(localMatch[1], 10) : null;
    const port = runtimePort ?? hostPort;
    if (previewUrl && port && !EXCLUDED_PORTS.has(port)) {
      candidates.push({ previewUrl, port });
    }
    localMatch = LOCAL_URL_PATTERN.exec(text);
  }

  return candidates;
};

export function extractPreviewCandidatesFromEvents(
  events: OHEvent[],
  limit: number = 50,
): ExtractedPreviewCandidate[] {
  const previewToCandidate = new Map<string, ExtractedPreviewCandidate>();
  const recentEvents = events.slice(-limit);
  const startIndex = Math.max(events.length - recentEvents.length, 0);

  for (let i = 0; i < recentEvents.length; i += 1) {
    const event = recentEvents[i];
    const eventIndex = startIndex + i;
    const texts = getEventTextContent(event);

    for (const text of texts) {
      const fromText = extractPreviewCandidatesFromText(text);
      fromText.forEach(({ previewUrl, port }) => {
        const existing = previewToCandidate.get(previewUrl);
        if (!existing || eventIndex >= existing.lastSeenEventIndex) {
          previewToCandidate.set(previewUrl, {
            previewUrl,
            port,
            lastSeenEventIndex: eventIndex,
          });
        }
      });
    }
  }

  return Array.from(previewToCandidate.values()).sort((a, b) => {
    if (a.lastSeenEventIndex !== b.lastSeenEventIndex) {
      return b.lastSeenEventIndex - a.lastSeenEventIndex;
    }
    return a.previewUrl.localeCompare(b.previewUrl);
  });
}
