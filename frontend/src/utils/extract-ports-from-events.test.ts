import { describe, expect, it } from "vitest";
import { OHEvent } from "#/stores/use-event-store";
import {
  extractPortCandidatesFromEvents,
  extractPreviewCandidatesFromEvents,
  extractPortsFromEvents,
} from "./extract-ports-from-events";

const makeLegacyEvent = (text: string): OHEvent =>
  ({ message: text, content: text } as unknown as OHEvent);

describe("extractPortsFromEvents", () => {
  it("prioritizes most recently seen ports", () => {
    const events = [
      makeLegacyEvent("server started at http://localhost:3000"),
      makeLegacyEvent("new server started at http://localhost:5178"),
    ];

    const ports = extractPortsFromEvents(events, 50);

    expect(ports[0]).toBe(5178);
    expect(ports).toContain(3000);
  });

  it("filters excluded ports", () => {
    const events = [
      makeLegacyEvent("ssh on localhost:22, web at localhost:5173"),
      makeLegacyEvent("https://127.0.0.1:443 and localhost:8080"),
    ];

    const ports = extractPortsFromEvents(events, 50);

    expect(ports).toContain(5173);
    expect(ports).toContain(8080);
    expect(ports).not.toContain(22);
    expect(ports).not.toContain(443);
  });

  it("tracks last seen index for each candidate", () => {
    const events = [
      makeLegacyEvent("localhost:5173"),
      makeLegacyEvent("localhost:3000"),
      makeLegacyEvent("localhost:5173"),
    ];

    const candidates = extractPortCandidatesFromEvents(events, 50);
    const first = candidates[0];

    expect(first.port).toBe(5173);
    expect(first.lastSeenEventIndex).toBe(2);
  });

  it("extracts explicit preview urls and prefers newest one", () => {
    const events = [
      makeLegacyEvent("页面预览地址: http://localhost:5173"),
      makeLegacyEvent("页面预览地址: http://localhost:5175"),
    ];

    const candidates = extractPreviewCandidatesFromEvents(events, 50);

    expect(candidates[0].previewUrl).toContain("http://localhost:5175");
    expect(candidates[0].port).toBe(5175);
  });

  it("extracts runtime url from v0 message content", () => {
    const v0Like = {
      message: "done",
      content: "Preview URL: http://localhost:3002/runtime/5175/",
    } as unknown as OHEvent;
    const candidates = extractPreviewCandidatesFromEvents([v0Like], 10);

    expect(candidates.length).toBe(1);
    expect(candidates[0].previewUrl).toContain("/runtime/5175/");
    expect(candidates[0].port).toBe(5175);
  });
});
