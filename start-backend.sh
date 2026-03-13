#!/bin/bash
export RUNTIME=local
export SKIP_DEPENDENCY_CHECK=1
export OH_DISABLE_MCP=true
export LLM_API_KEY=sk-sp-d2eb4c8d70b34de09c1586bfa7803ca6
export LLM_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
export LLM_MODEL=openai/MiniMax-M2.5
export DASHSCOPE_API_KEY=sk-5e357a56fdc04855a9829ab3a09cc050
export TAVILY_API_KEY=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
export PYTHONPATH="/Users/kylinmiao/.cursor/worktrees/atoms-plus/jfi:$PYTHONPATH"

cd /Users/kylinmiao/.cursor/worktrees/atoms-plus/jfi
exec /Users/kylinmiao/Documents/project/atoms-plus/.venv/bin/python -m atoms_plus.atoms_server
