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

// 启动阶段配置
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

  // 计算当前进度
  const currentStage = useMemo(() => {
    const stage = BOOTSTRAP_STAGES.find((s) => s.key === runtimeStatus);
    return stage || BOOTSTRAP_STAGES[0];
  }, [runtimeStatus]);

  // 模拟进度增长（在实际进度之间平滑过渡）
  useEffect(() => {
    const targetProgress = currentStage.progress;

    if (simulatedProgress < targetProgress) {
      const timer = setTimeout(() => {
        setSimulatedProgress((prev) => Math.min(prev + 2, targetProgress));
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [simulatedProgress, currentStage.progress]);

  // 轮换 tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 根据 taskStatus 获取友好的状态文本
  const statusText = useMemo(() => {
    if (taskStatus) {
      if (taskStatus === "WAITING_FOR_SANDBOX")
        return t(I18nKey.RUNTIME$WAITING_SANDBOX);
      if (taskStatus === "INITIALIZING") return t(I18nKey.RUNTIME$INITIALIZING);
      if (taskStatus === "STARTING") return t(I18nKey.COMMON$STARTING);
    }
    return t(currentStage.labelKey);
  }, [taskStatus, currentStage.labelKey, t]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 space-y-8">
      {/* 用户消息预览 */}
      {userMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md bg-indigo-600/20 border border-indigo-500/30 rounded-2xl px-6 py-4"
        >
          <p className="text-sm text-indigo-300 mb-1">
            {t(I18nKey.RUNTIME$YOUR_REQUEST)}
          </p>
          <p className="text-white font-medium line-clamp-2">{userMessage}</p>
        </motion.div>
      )}

      {/* 进度环 */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-neutral-700"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#gradient)"
            strokeWidth="8"
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
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
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
          <p className="text-sm text-neutral-400 mt-1">
            {t(I18nKey.RUNTIME$PLEASE_WAIT)}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Tips */}
      <AnimatePresence mode="wait">
        <motion.p
          key={tipIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm text-neutral-500 text-center max-w-sm"
        >
          💡 {t(TIPS[tipIndex])}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default RuntimeBootstrapProgress;
