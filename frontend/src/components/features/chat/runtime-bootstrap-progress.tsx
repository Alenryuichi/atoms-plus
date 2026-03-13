/**
 * RuntimeBootstrapProgress - 渐进式 Runtime 启动进度指示器
 *
 * 在 runtime 启动期间显示友好的进度信息，消除用户等待感。
 * 特点：
 * - 显示当前启动阶段和进度百分比
 * - 有趣的 tips 和动画
 * - 用户消息预览
 */

import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { I18nKey } from "#/i18n/declaration";
import type { RuntimeStatus } from "#/types/runtime-status";

// Runtime status → progress (used after WebSocket is connected)
const BOOTSTRAP_STAGES = [
  { key: "STATUS$STOPPED", progress: 0, labelKey: I18nKey.COMMON$STARTING },
  {
    key: "STATUS$BUILDING_RUNTIME",
    progress: 15,
    labelKey: I18nKey.RUNTIME$BUILDING,
  },
  {
    key: "STATUS$STARTING_RUNTIME",
    progress: 30,
    labelKey: I18nKey.RUNTIME$STARTING,
  },
  {
    key: "STATUS$RUNTIME_STARTED",
    progress: 45,
    labelKey: I18nKey.RUNTIME$STARTED,
  },
  {
    key: "STATUS$SETTING_UP_WORKSPACE",
    progress: 60,
    labelKey: I18nKey.RUNTIME$SETTING_UP_WORKSPACE,
  },
  {
    key: "STATUS$SETTING_UP_GIT_HOOKS",
    progress: 70,
    labelKey: I18nKey.RUNTIME$SETTING_UP_GIT,
  },
  {
    key: "STATUS$SETTING_UP_SKILLS",
    progress: 80,
    labelKey: I18nKey.RUNTIME$LOADING_SKILLS,
  },
  {
    key: "STATUS$CONNECTING_RUNTIME",
    progress: 35,
    labelKey: I18nKey.RUNTIME$CONNECTING,
  },
  {
    key: "STATUS$LOADING_MICROAGENTS",
    progress: 75,
    labelKey: I18nKey.RUNTIME$LOADING_MICROAGENTS,
  },
  {
    key: "STATUS$LOADING_MCP_TOOLS",
    progress: 85,
    labelKey: I18nKey.RUNTIME$LOADING_MCP,
  },
  {
    key: "STATUS$PREPARING_WORKSPACE",
    progress: 90,
    labelKey: I18nKey.RUNTIME$PREPARING,
  },
  {
    key: "STATUS$AGENT_READY",
    progress: 95,
    labelKey: I18nKey.RUNTIME$AGENT_READY,
  },
  { key: "STATUS$READY", progress: 100, labelKey: I18nKey.COMMON$READY },
];

// Task polling status → progress (used before the real conversation exists)
const TASK_STATUS_PROGRESS: Record<string, number> = {
  WORKING: 5,
  WAITING_FOR_SANDBOX: 15,
  PREPARING_REPOSITORY: 30,
  RUNNING_SETUP_SCRIPT: 45,
  SETTING_UP_GIT_HOOKS: 60,
  SETTING_UP_SKILLS: 75,
  STARTING_CONVERSATION: 85,
  READY: 95,
};

// 随机 tips
const TIPS = [
  I18nKey.RUNTIME_TIP$1,
  I18nKey.RUNTIME_TIP$2,
  I18nKey.RUNTIME_TIP$3,
  I18nKey.RUNTIME_TIP$4,
  I18nKey.RUNTIME_TIP$5,
];

interface RuntimeBootstrapProgressProps {
  runtimeStatus?: RuntimeStatus | null;
  userMessage?: string;
  taskStatus?: string | null;
}

export function RuntimeBootstrapProgress({
  runtimeStatus,
  userMessage,
  taskStatus,
}: RuntimeBootstrapProgressProps) {
  const { t } = useTranslation();
  const [tipIndex, setTipIndex] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Derive progress from runtimeStatus first, then taskStatus as fallback
  const targetProgress = useMemo(() => {
    const runtimeStage = BOOTSTRAP_STAGES.find(
      (s) => s.key === runtimeStatus,
    );
    if (runtimeStage) return runtimeStage.progress;

    if (taskStatus && taskStatus in TASK_STATUS_PROGRESS) {
      return TASK_STATUS_PROGRESS[taskStatus];
    }

    return 0;
  }, [runtimeStatus, taskStatus]);

  // Smooth progress animation towards the target
  useEffect(() => {
    if (simulatedProgress < targetProgress) {
      const timer = setTimeout(() => {
        setSimulatedProgress((prev) => Math.min(prev + 2, targetProgress));
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [simulatedProgress, targetProgress]);

  // 轮换 tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusText = useMemo(() => {
    if (taskStatus) {
      if (taskStatus === "WORKING") return t(I18nKey.COMMON$STARTING);
      if (taskStatus === "WAITING_FOR_SANDBOX")
        return t(I18nKey.RUNTIME$WAITING_SANDBOX);
      if (taskStatus === "PREPARING_REPOSITORY")
        return t(I18nKey.RUNTIME$STARTING);
      if (taskStatus === "RUNNING_SETUP_SCRIPT")
        return t(I18nKey.RUNTIME$SETTING_UP_WORKSPACE);
      if (taskStatus === "SETTING_UP_GIT_HOOKS")
        return t(I18nKey.RUNTIME$SETTING_UP_GIT);
      if (taskStatus === "SETTING_UP_SKILLS")
        return t(I18nKey.RUNTIME$LOADING_SKILLS);
      if (taskStatus === "STARTING_CONVERSATION")
        return t(I18nKey.RUNTIME$PREPARING);
      if (taskStatus === "READY") return t(I18nKey.RUNTIME$CONNECTING);
    }

    const runtimeStage = BOOTSTRAP_STAGES.find(
      (s) => s.key === runtimeStatus,
    );
    return t(runtimeStage?.labelKey ?? I18nKey.COMMON$STARTING);
  }, [taskStatus, runtimeStatus, t]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 space-y-8">
      {/* 用户消息预览 - Amber Glassmorphism */}
      {userMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md bg-[#d4a855]/10 backdrop-blur-sm border border-[#d4a855]/30 rounded-2xl px-6 py-4 shadow-[0_0_20px_rgba(212,168,85,0.1)]"
        >
          <p className="text-sm text-[#d4a855]/80 mb-1">
            {t(I18nKey.RUNTIME$YOUR_REQUEST)}
          </p>
          <p className="text-white font-medium line-clamp-2">{userMessage}</p>
        </motion.div>
      )}

      {/* 进度环 - Amber Gradient */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          {/* Background track */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-neutral-800"
          />
          {/* Progress arc */}
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#amber-gradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={352}
            initial={{ strokeDashoffset: 352 }}
            animate={{
              strokeDashoffset: 352 - (352 * simulatedProgress) / 100,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          <defs>
            <linearGradient
              id="amber-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#b8860b" />
              <stop offset="50%" stopColor="#d4a855" />
              <stop offset="100%" stopColor="#f0c674" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold text-[#d4a855]">
            {simulatedProgress}%
          </span>
        </div>
      </div>

      {/* 状态文本 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={statusText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-center"
        >
          <p className="text-lg font-medium text-white">{statusText}</p>
          <p className="text-sm text-neutral-500 mt-1">
            {t(I18nKey.RUNTIME$PLEASE_WAIT)}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Tips - Subtle amber accent */}
      <AnimatePresence mode="wait">
        <motion.p
          key={tipIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm text-neutral-400 text-center max-w-sm"
        >
          <span className="text-[#d4a855]/70">💡</span> {t(TIPS[tipIndex])}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default RuntimeBootstrapProgress;
