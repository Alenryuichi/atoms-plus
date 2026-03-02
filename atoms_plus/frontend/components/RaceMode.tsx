/**
 * Race Mode Component - 多模型竞速对比页面
 *
 * 这是一个独立的 React 组件，可以通过以下方式集成到 OpenHands 前端：
 * 1. 复制到 frontend/src/routes/ 并在 routes.ts 中注册
 * 2. 或作为独立的微前端应用
 *
 * 依赖：
 * - React 18+
 * - react-i18next
 * - Tailwind CSS
 * - ../api/race-service.ts
 */

import React from "react";
import {
  startRace,
  selectBest,
  getSupportedModels,
  type RaceResultResponse,
} from "../api/race-service";

// 模型颜色映射
const MODEL_COLORS: Record<string, string> = {
  claude: "bg-orange-500",
  gpt: "bg-green-500",
  gemini: "bg-blue-500",
  deepseek: "bg-purple-500",
  mistral: "bg-red-500",
};

function getModelColor(model: string): string {
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (model.toLowerCase().includes(key)) return color;
  }
  return "bg-gray-500";
}

export default function RaceMode() {
  const [prompt, setPrompt] = React.useState("");
  const [selectedModels, setSelectedModels] = React.useState<string[]>([
    "claude-sonnet-4-20250514",
    "gpt-4o",
    "gemini/gemini-2.0-flash",
  ]);
  const [results, setResults] = React.useState<RaceResultResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [winner, setWinner] = React.useState<RaceResultResponse | null>(null);
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);

  React.useEffect(() => {
    getSupportedModels()
      .then((data) => setAvailableModels(data.models))
      .catch(() => {});
  }, []);

  const handleStartRace = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResults([]);
    setWinner(null);
    try {
      const response = await startRace({ prompt, models: selectedModels });
      setSessionId(response.session_id);
      setResults(response.results);
    } catch (error) {
      console.error("Race failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBest = async (criteria: "balanced" | "speed" | "cost") => {
    if (!sessionId) return;
    try {
      const best = await selectBest({ session_id: sessionId, criteria });
      setWinner(best);
    } catch (error) {
      console.error("Select best failed:", error);
    }
  };

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        🏎️ Race Mode
        <span className="text-sm font-normal text-neutral-400">
          多模型竞速对比
        </span>
      </h1>

      {/* 输入区域 */}
      <div className="mb-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入您的任务描述..."
          className="w-full h-32 p-4 rounded-lg bg-neutral-800 border border-neutral-700 text-white resize-none"
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          {availableModels.slice(0, 6).map((model) => (
            <button
              key={model}
              onClick={() => toggleModel(model)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedModels.includes(model)
                  ? `${getModelColor(model)} text-white`
                  : "bg-neutral-700 text-neutral-300"
              }`}
            >
              {model.split("/").pop()?.split("-")[0] || model}
            </button>
          ))}
        </div>
        <button
          onClick={handleStartRace}
          disabled={isLoading || !prompt.trim()}
          className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 rounded-lg font-semibold"
        >
          {isLoading ? "⏳ 竞速中..." : "🚀 开始竞速"}
        </button>
      </div>

      {/* 结果区域 - 继续在下一个文件或使用 str-replace-editor 添加 */}
      <RaceResults
        results={results}
        winner={winner}
        onSelectBest={handleSelectBest}
      />
    </div>
  );
}

// 结果展示子组件
function RaceResults({
  results,
  winner,
  onSelectBest,
}: {
  results: RaceResultResponse[];
  winner: RaceResultResponse | null;
  onSelectBest: (criteria: "balanced" | "speed" | "cost") => void;
}) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onSelectBest("balanced")}
          className="px-4 py-2 bg-purple-600 rounded"
        >
          ⚖️ 均衡最优
        </button>
        <button
          onClick={() => onSelectBest("speed")}
          className="px-4 py-2 bg-yellow-600 rounded"
        >
          ⚡ 最快
        </button>
        <button
          onClick={() => onSelectBest("cost")}
          className="px-4 py-2 bg-green-600 rounded"
        >
          💰 最便宜
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, idx) => (
          <ResultCard key={idx} result={result} isWinner={winner?.model_name === result.model_name} />
        ))}
      </div>
    </div>
  );
}

// 单个结果卡片
function ResultCard({
  result,
  isWinner,
}: {
  result: RaceResultResponse;
  isWinner: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        isWinner
          ? "border-yellow-500 bg-yellow-500/10"
          : "border-neutral-700 bg-neutral-800"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-3 h-3 rounded-full ${getModelColor(result.model_name)}`} />
        <span className="font-semibold">{result.model_name.split("/").pop()}</span>
        {isWinner && <span>🏆</span>}
      </div>
      <div className="text-xs text-neutral-400 mb-2 flex gap-3">
        <span>⏱️ {result.execution_time.toFixed(2)}s</span>
        <span>💰 ${result.cost_estimate.toFixed(4)}</span>
        <span>🔢 {result.token_count}</span>
      </div>
      {result.error ? (
        <div className="text-red-400 text-sm">❌ {result.error}</div>
      ) : (
        <pre className="text-sm text-neutral-300 whitespace-pre-wrap max-h-48 overflow-auto">
          {result.response.slice(0, 500)}
          {result.response.length > 500 ? "..." : ""}
        </pre>
      )}
    </div>
  );
}

