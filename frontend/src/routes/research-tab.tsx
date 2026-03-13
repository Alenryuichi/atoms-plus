import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  IconFlask,
  IconEdit,
  IconEye,
  IconCopy,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconCircleDashed,
  IconLoader2,
  IconAlertCircle,
  IconExternalLink,
  IconDownload,
} from "@tabler/icons-react";
import { I18nKey } from "#/i18n/declaration";
import { useConversationStore } from "#/stores/conversation-store";
import {
  useResearchStore,
  type SectionProgress,
  type ResearchProgressEvent,
} from "#/stores/research-store";
import { MarkdownRenderer } from "#/components/features/markdown/markdown-renderer";
import { useElapsedTimer, formatElapsed } from "#/hooks/use-elapsed-timer";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { ResearchService } from "#/api/research-service/research-service.api";

/**
 * Override code block backgrounds within research panels.
 * SyntaxHighlighter uses inline styles (vscDarkPlus #1e1e1e) which need
 * !important to override. Targets both plain <pre> and SyntaxHighlighter
 * containers (PreTag="div" with class="rounded-lg").
 */
const RESEARCH_CODE_STYLE = `
.research-prose pre {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0.5em 0 !important;
}
.research-prose pre[style] {
  background: rgba(255, 255, 255, 0.03) !important;
  background-color: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 8px !important;
  padding: 1em !important;
}
.research-prose .rounded-lg,
.research-prose .rounded-lg[style] {
  background: rgba(255, 255, 255, 0.03) !important;
  background-color: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 8px !important;
}
.research-prose code[class*="language-"],
.research-prose code[class*="language-"][style],
.research-prose .rounded-lg code,
.research-prose .rounded-lg code[style] {
  background: transparent !important;
  background-color: transparent !important;
}
`;

const EVENT_ICONS: Record<string, string> = {
  started: "\u{1F680}",
  rewriting: "\u{270F}\u{FE0F}",
  rewrite_complete: "\u{2705}",
  structure_ready: "\u{1F4CB}",
  section_started: "\u{1F4D6}",
  searching: "\u{1F50D}",
  summarizing: "\u{1F4DD}",
  reflecting: "\u{1F914}",
  section_completed: "\u{2705}",
  generating_report: "\u{1F4C4}",
  completed: "\u{1F389}",
  error: "\u{274C}",
};

// ─── Section Lane ────────────────────────────────────────────────────────────

const SectionLane = React.memo(function SectionLane({
  section,
  forceCollapsed,
}: {
  section: SectionProgress;
  forceCollapsed?: boolean;
}) {
  const [expanded, setExpanded] = useState(section.status === "running");

  useEffect(() => {
    if (forceCollapsed) {
      setExpanded(false);
    } else if (section.status === "running") {
      setExpanded(true);
    }
  }, [section.status, forceCollapsed]);

  const pct = Math.round(section.progress * 100);

  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden bg-white/[0.015]">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Status icon */}
        <div className="shrink-0 w-5 flex justify-center">
          {section.status === "queued" && (
            <IconCircleDashed className="w-4 h-4 text-white/20" />
          )}
          {section.status === "running" && (
            <IconLoader2 className="w-4 h-4 text-amber-400 animate-spin" />
          )}
          {section.status === "done" && (
            <IconCircleCheck className="w-4 h-4 text-emerald-400" />
          )}
          {section.status === "error" && (
            <IconAlertCircle className="w-4 h-4 text-red-400" />
          )}
        </div>

        {/* Title + step */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xs font-medium truncate ${
                section.status === "queued"
                  ? "text-white/30"
                  : section.status === "running"
                    ? "text-white/80"
                    : "text-white/60"
              }`}
            >
              S{section.index + 1}: {section.title}
            </span>
          </div>
          {section.status === "running" && section.currentStep && (
            <p className="text-[10px] text-amber-400/60 truncate mt-0.5">
              {section.currentStep}
            </p>
          )}
        </div>

        {/* Mini progress bar + pct (only when running) */}
        {section.status === "running" && (
          <div className="shrink-0 flex items-center gap-2 w-24">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[10px] font-mono text-white/40 w-7 text-right">
              {pct}%
            </span>
          </div>
        )}

        {section.status === "done" && (
          <span className="text-[10px] font-mono text-emerald-400/60 shrink-0">
            100%
          </span>
        )}

        {/* Expand chevron */}
        <div className="shrink-0 text-white/20">
          {expanded ? (
            <IconChevronDown className="w-3.5 h-3.5" />
          ) : (
            <IconChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Expanded event log */}
      <AnimatePresence>
        {expanded && section.events.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.04] px-3 py-1.5 space-y-0.5 max-h-40 overflow-y-auto bg-black/20">
              {section.events.map((ev, i) => (
                <div
                  key={`${ev.event}-${i}`}
                  className="flex items-start gap-1.5 text-[10px] py-0.5"
                >
                  <span className="shrink-0 mt-px">
                    {EVENT_ICONS[ev.event] || "\u{2022}"}
                  </span>
                  <span className="text-white/40 break-words min-w-0">
                    {ev.message || ev.event}
                  </span>
                  {ev.progress != null && (
                    <span className="text-white/15 font-mono shrink-0 ml-auto">
                      {Math.round(ev.progress * 100)}%
                    </span>
                  )}
                </div>
              ))}
              {section.sources.length > 0 && (
                <div className="pt-1 mt-1 border-t border-white/[0.04]">
                  <span className="text-[9px] text-white/20 font-medium uppercase tracking-wider">
                    Sources ({section.sources.length})
                  </span>
                  {section.sources.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-blue-400/50 hover:text-blue-400/80 truncate py-0.5 transition-colors"
                    >
                      <IconExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── Research Dashboard (live progress) ──────────────────────────────────────

const StreamingReportPane = React.memo(function StreamingReportPane({ isError }: { isError: boolean }) {
  const streamingReport = useResearchStore((s) => s.streamingReport);
  const reportEndRef = useRef<HTMLDivElement>(null);
  const reportScrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    const container = reportScrollRef.current;
    if (!container) return undefined;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 60;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (streamingReport && reportEndRef.current && !userScrolledUp.current) {
      reportEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingReport]);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-amber-400/70">
        {!isError && <IconLoader2 className="w-4 h-4 animate-spin" />}
        <span>
          {streamingReport
            ? `Generating final report (${streamingReport.length} chars)...`
            : "Generating final report..."}
        </span>
      </div>
      {streamingReport && (
        <div ref={reportScrollRef} className="mx-2 mt-1 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] max-h-[50vh] overflow-auto">
          <pre className="text-white/60 text-[12px] leading-relaxed whitespace-pre-wrap font-mono break-words">{streamingReport}</pre>
          <div ref={reportEndRef} />
        </div>
      )}
    </div>
  );
});

function ResearchDashboard() {
  const { t } = useTranslation();
  const phase = useResearchStore((s) => s.phase);
  const progress = useResearchStore((s) => s.progress);
  const progressMessage = useResearchStore((s) => s.progressMessage);
  const progressEvents = useResearchStore((s) => s.progressEvents);
  const sections = useResearchStore((s) => s.sections);
  const elapsed = useElapsedTimer(phase);

  const percentage = Math.round(progress * 100);
  const estimatedTotal = progress > 0.05 ? Math.round(elapsed / progress) : 180;
  const remaining = Math.max(0, estimatedTotal - elapsed);

  const runningCount = sections.filter((s) => s.status === "running").length;
  const doneCount = sections.filter((s) => s.status === "done").length;

  const isGeneratingReport = progressEvents.some(
    (e) => e.event === "generating_report",
  );

  // Global events are those without a section_index
  const globalEvents = progressEvents.filter((e) => e.section_index == null);

  return (
    <div className="flex flex-col w-full h-full">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-neutral-900/50 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <span className="text-sm">{"\u{1F52C}"}</span>
              </div>
              {phase !== "error" && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-amber-400/50"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-xs">
                {t(I18nKey.ATOMS$RESEARCH_TITLE)}
              </h3>
              <p className={`text-[11px] ${phase === "error" ? "text-red-400/70" : "text-white/40"}`}>
                {phase === "error"
                  ? "Connection lost — progress preserved"
                  : sections.length > 0
                    ? `Researching ${sections.length} sections (${runningCount} running, ${doneCount} done)`
                    : phase === "connecting"
                      ? t(I18nKey.ATOMS$RESEARCH_CONNECTING)
                      : t(I18nKey.ATOMS$RESEARCH_ANALYZING)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-amber-400 font-mono text-sm font-semibold block">
              {percentage}%
            </span>
            <span className="text-white/30 text-[10px] font-mono">
              {formatElapsed(elapsed)}
              {progress > 0.05 && ` · ~${formatElapsed(remaining)} left`}
            </span>
          </div>
        </div>

        {/* Total progress bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          {phase === "connecting" ? (
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500/50 to-orange-500/50"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: "40%" }}
            />
          ) : (
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={false}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}
        </div>

        {/* Error banner */}
        {phase === "error" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20">
            <IconAlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-red-300/80 text-[11px]">
              WebSocket disconnected during report generation. Progress data preserved.
            </span>
          </div>
        )}

        {/* Global status message */}
        <AnimatePresence mode="wait">
          {progressMessage && phase !== "error" && (
            <motion.p
              key={progressMessage}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className="text-white/50 text-[11px] leading-relaxed"
            >
              {progressMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Section lanes ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-3 space-y-1.5">
        {/* Global events (rewriting, structure_ready, etc.) */}
        {globalEvents.length > 0 && sections.length === 0 && (
          <div className="space-y-0.5 mb-2">
            {globalEvents.map((ev, i) => (
              <div
                key={`global-${ev.event}-${i}`}
                className="flex items-start gap-1.5 text-[11px] px-2 py-0.5"
              >
                <span className="shrink-0 mt-px">
                  {EVENT_ICONS[ev.event] || "\u{2022}"}
                </span>
                <span className="text-white/40">
                  {ev.message || ev.event}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Section lanes */}
        {sections.map((section) => (
          <SectionLane
            key={section.index}
            section={section}
            forceCollapsed={isGeneratingReport}
          />
        ))}

        {/* Report generation phase (after all sections done) */}
        {progressEvents.some((e) => e.event === "generating_report") && (
          <StreamingReportPane isError={phase === "error"} />
        )}
      </div>
    </div>
  );
}

// ─── Report TOC ──────────────────────────────────────────────────────────────

interface TocEntry { id: string; text: string; level: number }

function parseHeadings(markdown: string): TocEntry[] {
  const lines = markdown.split("\n");
  const entries: TocEntry[] = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.startsWith("```")) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const text = match[2].replace(/[*_`~]/g, "").trim();
      const slug = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
      const id = slug || `heading-${entries.length}`;
      entries.push({ id, text, level: match[1].length });
    }
  }
  return entries;
}

function ReportTOC({ content, scrollContainerRef }: { content: string; scrollContainerRef: React.RefObject<HTMLDivElement | null> }) {
  const headings = React.useMemo(() => parseHeadings(content), [content]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || headings.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: 0.1 },
    );
    for (const h of headings) {
      if (!h.id) continue;
      const el = container.querySelector(`#${CSS.escape(h.id)}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings, scrollContainerRef]);

  if (headings.length < 2) return null;

  return (
    <nav className="border-b border-white/[0.06] bg-neutral-900/30 shrink-0 overflow-x-auto">
      <div className="flex items-center gap-1 px-4 py-1.5">
        <span className="text-[10px] text-white/20 font-medium mr-1 shrink-0">TOC</span>
        {headings.map((h, idx) => (
          <button
            key={h.id || `toc-${idx}`}
            type="button"
            onClick={() => {
              if (!h.id) return;
              const el = scrollContainerRef.current?.querySelector(`#${CSS.escape(h.id)}`);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`text-[10px] px-2 py-1 rounded whitespace-nowrap transition-colors ${
              h.level === 3 ? "ml-1" : ""
            } ${
              activeId === h.id
                ? "bg-amber-500/15 text-amber-400"
                : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
            }`}
          >
            {h.text}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Report View (preview / edit) ────────────────────────────────────────────

type ViewMode = "preview" | "edit";

function ResearchTab() {
  const { t } = useTranslation();
  const { researchReport, setResearchReport } = useConversationStore();
  const researchPhase = useResearchStore((s) => s.phase);
  const { data: conversation } = useActiveConversation();
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [editBuffer, setEditBuffer] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const isResearchInProgress =
    researchPhase === "connecting" || researchPhase === "researching";
  const showDashboard = isResearchInProgress || researchPhase === "error";

  useEffect(() => {
    if (viewMode === "edit" && researchReport) {
      setEditBuffer(researchReport);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [viewMode, researchReport]);

  const handleSave = useCallback(() => {
    setResearchReport(editBuffer);
    setViewMode("preview");
    // Sync edited report to sandbox
    const sandboxId = conversation?.sandbox_id;
    if (sandboxId && editBuffer) {
      ResearchService.saveReport({
        sandbox_id: sandboxId,
        report: editBuffer,
      }).catch((err) => {
        console.warn("[Deep Research] Failed to sync edited report to sandbox:", err);
      });
    }
  }, [editBuffer, setResearchReport, conversation?.sandbox_id]);

  const handleCancel = useCallback(() => {
    setViewMode("preview");
  }, []);

  const handleCopy = useCallback(async () => {
    if (!researchReport) return;
    await navigator.clipboard.writeText(researchReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [researchReport]);

  const researchQuery = useResearchStore((s) => s.query);

  const handleDownload = useCallback(() => {
    if (!researchReport) return;
    const titleMatch = researchReport.match(/^#\s+(.+)/m);
    const titleText = titleMatch?.[1]?.replace(/[*_`~#]/g, "").trim();
    let name: string;
    if (titleText) {
      name = titleText;
    } else if (researchQuery?.trim()) {
      name = researchQuery.trim();
    } else {
      name = `research-report-${new Date().toISOString().slice(0, 10)}`;
    }
    const safeName = name.replace(/[/\\:*?"<>|]/g, "").replace(/\s+/g, "-").slice(0, 100) || "research-report";
    const blob = new Blob([researchReport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [researchReport, researchQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  if (showDashboard) {
    return <ResearchDashboard />;
  }

  if (!researchReport) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-10">
        <div className="w-20 h-20 rounded-2xl bg-neutral-800/50 border border-white/[0.06] flex items-center justify-center mb-6">
          <IconFlask className="w-10 h-10 text-neutral-500" stroke={1.5} />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          {t(I18nKey.ATOMS$RESEARCH_TAB_EMPTY_TITLE)}
        </h3>
        <p className="text-sm text-neutral-500 max-w-xs text-center">
          {t(I18nKey.ATOMS$RESEARCH_TAB_EMPTY_DESC)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-neutral-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "preview"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <IconEye className="w-3.5 h-3.5" />
              {t(I18nKey.ATOMS$RESEARCH_TAB_PREVIEW)}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "edit"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <IconEdit className="w-3.5 h-3.5" />
              {t(I18nKey.ATOMS$RESEARCH_TAB_EDIT)}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "edit" && (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {t(I18nKey.ATOMS$RESEARCH_TAB_CANCEL_EDIT)}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
              >
                {t(I18nKey.ATOMS$RESEARCH_TAB_SAVE)}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            title="Download as Markdown"
          >
            <IconDownload className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <IconCheck className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <IconCopy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "preview" ? (
        <div className="flex flex-col flex-1 min-h-0">
          <ReportTOC content={researchReport} scrollContainerRef={previewScrollRef} />
          <div ref={previewScrollRef} className="flex-1 overflow-auto p-4">
            <div className="research-prose prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
              <MarkdownRenderer
                content={researchReport}
                includeHeadings
                includeStandard
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={editBuffer}
            onChange={(e) => setEditBuffer(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none bg-transparent text-white/80 text-sm font-mono leading-relaxed p-4 outline-none"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}

function ResearchTabWithStyles() {
  return (
    <>
      <style>{RESEARCH_CODE_STYLE}</style>
      <ResearchTab />
    </>
  );
}

export default ResearchTabWithStyles;
