/**
 * Preview Panel Mock Handlers
 *
 * Provides mock data for the Preview panel including:
 * - Web-previewable files (HTML, TSX, CSS, JS)
 * - File content for code editor and preview
 *
 * These handlers override the default file-service-handlers when
 * VITE_MOCK_API=true to enable full preview functionality.
 */

import { delay, http, HttpResponse } from "msw";

// ============================================
// Mock File Data
// ============================================

/**
 * Web-previewable files that appear in the Preview panel
 * These match WEB_PREVIEWABLE_EXTENSIONS in use-workspace-files.ts
 */
export const PREVIEW_FILES = [
  "App.tsx",
  "styles.css",
  "Button.tsx",
];

/**
 * Mock file contents for preview
 * Exported for use in PreviewPanel mock mode
 *
 * NOTE: Sandpack react-ts template expects flat structure:
 * - /App.tsx (main component)
 * - /styles.css (global styles)
 * - Sandpack handles index.html and main.tsx internally
 */
export const MOCK_FILE_CONTENTS: Record<string, string> = {
  "App.tsx": `import { useState } from 'react';
import { Button } from './Button';
import './styles.css';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app-container">
      <header className="header">
        <h1>🚀 Atoms Plus</h1>
        <p className="subtitle">AI-Powered Development Platform</p>
      </header>

      <main className="main-content">
        <div className="counter-card">
          <p className="count-display">{count}</p>
          <div className="button-group">
            <Button onClick={() => setCount(c => c - 1)}>-</Button>
            <Button onClick={() => setCount(c => c + 1)}>+</Button>
          </div>
          <Button onClick={() => setCount(0)} variant="secondary">
            Reset
          </Button>
        </div>
      </main>

      <footer className="footer">
        <p>Built with ❤️ using OpenHands</p>
      </footer>
    </div>
  );
}`,

  "styles.css": `/* Atoms Plus Preview Styles */
:root {
  --amber-500: #d4a855;
  --amber-600: #b8922f;
  --bg-dark: #0a0a0a;
  --bg-card: rgba(0, 0, 0, 0.4);
  --text-primary: #ffffff;
  --text-secondary: #a3a3a3;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: var(--text-primary);
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 3rem;
  background: linear-gradient(135deg, var(--amber-500), var(--amber-600));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.counter-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 3rem;
  text-align: center;
  min-width: 300px;
}

.count-display {
  font-size: 5rem;
  font-weight: bold;
  color: var(--amber-500);
  margin-bottom: 1.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.footer {
  margin-top: 3rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}`,

  "Button.tsx": `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({
  children,
  onClick,
  variant = 'primary'
}: ButtonProps) {
  const baseStyles = \`
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  \`;

  const variantStyles = variant === 'primary'
    ? \`
      background: linear-gradient(135deg, #d4a855, #b8922f);
      color: #0a0a0a;
      border-color: rgba(212, 168, 85, 0.5);
    \`
    : \`
      background: rgba(0, 0, 0, 0.3);
      color: #d4a855;
      border-color: rgba(212, 168, 85, 0.3);
    \`;

  return (
    <button
      onClick={onClick}
      style={{ ...parseStyles(baseStyles), ...parseStyles(variantStyles) }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 168, 85, 0.3)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
}

function parseStyles(styleString: string): React.CSSProperties {
  const styles: Record<string, string> = {};
  styleString.split(';').forEach(rule => {
    const [key, value] = rule.split(':').map(s => s.trim());
    if (key && value) {
      const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
      styles[camelKey] = value;
    }
  });
  return styles as React.CSSProperties;
}`,
};

// ============================================
// MSW Handlers
// ============================================

export const PREVIEW_HANDLERS = [
  /**
   * List workspace files - returns web-previewable files
   * Overrides the default file-service handler
   */
  http.get(
    "/api/conversations/:conversationId/list-files",
    async ({ request }) => {
      await delay(100); // Short delay for realism

      const url = new URL(request.url);
      const path = url.searchParams.get("path");

      // If requesting a subdirectory, filter files
      if (path) {
        const filesInPath = PREVIEW_FILES.filter((f) =>
          f.startsWith(path + "/") || f.startsWith(path)
        );
        // Return relative paths from the requested directory
        const relativePaths = filesInPath.map((f) => {
          if (f.startsWith(path + "/")) {
            return f.slice(path.length + 1);
          }
          return f;
        });
        return HttpResponse.json(relativePaths);
      }

      // Return root level items (files and directories)
      const rootItems = new Set<string>();
      PREVIEW_FILES.forEach((file) => {
        const parts = file.split("/");
        rootItems.add(parts[0]); // Add first part (file or directory)
      });

      return HttpResponse.json(Array.from(rootItems));
    },
  ),

  /**
   * Get file content for preview
   */
  http.get(
    "/api/conversations/:conversationId/select-file",
    async ({ request }) => {
      await delay(50);

      const url = new URL(request.url);
      const file = url.searchParams.get("file");

      if (file && MOCK_FILE_CONTENTS[file]) {
        return HttpResponse.json({ code: MOCK_FILE_CONTENTS[file] });
      }

      // Return a placeholder for unknown files
      if (file) {
        return HttpResponse.json({
          code: `// File: ${file}\n// Content not available in mock mode`,
        });
      }

      return HttpResponse.json(null, { status: 404 });
    },
  ),
];

