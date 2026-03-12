import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import React from "react";
import { Command, useCommandStore } from "#/stores/command-store";
import { parseTerminalOutput } from "#/utils/parse-terminal-output";

/*
  NOTE: Tests for this hook are indirectly covered by the tests for the XTermTerminal component.
  The reason for this is that the hook exposes a ref that requires a DOM element to be rendered.
*/

const renderCommand = (
  command: Command,
  terminal: Terminal,
  isUserInput: boolean = false,
) => {
  const { content, type } = command;

  if (type === "input" && isUserInput) {
    return;
  }

  const trimmedContent = (content || "").replaceAll("\n", "\r\n").trim();
  if (!trimmedContent) return;

  if (type === "input") {
    // Green prompt for commands, reset color after
    terminal.writeln(`\x1b[38;2;166;227;161m$ ${parseTerminalOutput(trimmedContent)}\x1b[0m`);
  } else {
    terminal.writeln(parseTerminalOutput(trimmedContent));
  }
};

/**
 * Check if the terminal is ready for fit operations.
 * This prevents the "Cannot read properties of undefined (reading 'dimensions')" error
 * that occurs when fit() is called on a terminal that is hidden, disposed, or not fully initialized.
 */
const canFitTerminal = (
  terminalInstance: Terminal | null,
  fitAddonInstance: FitAddon | null,
  containerElement: HTMLDivElement | null,
): boolean => {
  // Check terminal and fitAddon exist
  if (!terminalInstance || !fitAddonInstance) {
    return false;
  }

  // Check container element exists
  if (!containerElement) {
    return false;
  }

  // Check element is visible (not display: none)
  // When display is none, offsetParent is null (except for fixed/body elements)
  const computedStyle = window.getComputedStyle(containerElement);
  if (computedStyle.display === "none") {
    return false;
  }

  // Check element has dimensions
  const { clientWidth, clientHeight } = containerElement;
  if (clientWidth === 0 || clientHeight === 0) {
    return false;
  }

  // Check terminal has been opened (element property is set after open())
  if (!terminalInstance.element) {
    return false;
  }

  return true;
};

// Create a persistent reference that survives component unmounts
// This ensures terminal history is preserved when navigating away and back
const persistentLastCommandIndex = { current: 0 };

export const useTerminal = () => {
  const commands = useCommandStore((state) => state.commands);
  const terminal = React.useRef<Terminal | null>(null);
  const fitAddon = React.useRef<FitAddon | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const lastCommandIndex = persistentLastCommandIndex; // Use the persistent reference
  const isDisposed = React.useRef(false);

  const createTerminal = () =>
    new Terminal({
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 14,
      scrollback: 10000,
      scrollSensitivity: 1,
      fastScrollSensitivity: 5,
      disableStdin: true,
      allowTransparency: true,
      theme: {
        background: "transparent",
        foreground: "#d4d4d8",
        cursor: "#d4d4d8",
        cursorAccent: "#1e1e2e",
        selectionBackground: "rgba(255, 255, 255, 0.08)",
        selectionForeground: undefined,
        selectionInactiveBackground: "rgba(255, 255, 255, 0.04)",
        black: "#45475a",
        red: "#f38ba8",
        green: "#a6e3a1",
        yellow: "#f9e2af",
        blue: "#89b4fa",
        magenta: "#cba6f7",
        cyan: "#94e2d5",
        white: "#bac2de",
        brightBlack: "#585b70",
        brightRed: "#f38ba8",
        brightGreen: "#a6e3a1",
        brightYellow: "#f9e2af",
        brightBlue: "#89b4fa",
        brightMagenta: "#cba6f7",
        brightCyan: "#94e2d5",
        brightWhite: "#a6adc8",
      },
    });

  const fitTerminalSafely = React.useCallback(() => {
    if (isDisposed.current) {
      return;
    }
    if (canFitTerminal(terminal.current, fitAddon.current, ref.current)) {
      fitAddon.current!.fit();
    }
  }, []);

  const initializeTerminal = () => {
    if (terminal.current) {
      if (fitAddon.current) terminal.current.loadAddon(fitAddon.current);
      if (ref.current) {
        terminal.current.open(ref.current);
        // Hide cursor for read-only terminal using ANSI escape sequence
        terminal.current.write("\x1b[?25l");
        fitTerminalSafely();
      }
    }
  };

  // Initialize terminal and handle cleanup
  React.useEffect(() => {
    isDisposed.current = false;
    terminal.current = createTerminal();
    fitAddon.current = new FitAddon();

    if (ref.current) {
      initializeTerminal();
      // Render all commands in array
      // This happens when we just switch to Terminal from other tabs
      if (commands.length > 0) {
        for (let i = 0; i < commands.length; i += 1) {
          renderCommand(commands[i], terminal.current, false);
        }
        lastCommandIndex.current = commands.length;
      }
      // Don't show prompt in read-only terminal
    }

    return () => {
      isDisposed.current = true;
      terminal.current?.dispose();
      lastCommandIndex.current = 0;
    };
  }, []);

  React.useEffect(() => {
    if (
      terminal.current &&
      commands.length > 0 &&
      lastCommandIndex.current < commands.length
    ) {
      for (let i = lastCommandIndex.current; i < commands.length; i += 1) {
        renderCommand(commands[i], terminal.current, false);
      }
      lastCommandIndex.current = commands.length;
    }
  }, [commands]);

  React.useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to debounce resize events and ensure DOM is ready
      requestAnimationFrame(() => {
        fitTerminalSafely();
      });
    });

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver?.disconnect();
    };
  }, [fitTerminalSafely]);

  return ref;
};
