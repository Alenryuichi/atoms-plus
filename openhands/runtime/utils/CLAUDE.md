# CLI Command Execution Rules

## Context

BashSession uses `libtmux` to execute commands. tmux provides a PTY, causing `process.stdin.isTTY = true` for all child processes. This triggers interactive prompts in CLI tools even when `CI=true`.

## Rule: Always use non-interactive flags

When generating or executing CLI commands that may prompt for input, ALWAYS include the appropriate non-interactive flag.

## Command Mappings

```yaml
npm_create_vite:
  wrong: npm create vite@latest app -- --template react-ts
  correct: npm create vite@latest app -- --template react-ts --no-interactive
  reason: create-vite ignores CI env, checks isTTY directly

npx_create_vite:
  wrong: npx --yes create-vite@latest app --template react-ts
  correct: npx create-vite@latest app --template react-ts --no-interactive
  reason: create-vite's beta prompt still appears under PTY; --yes is not sufficient

npx:
  wrong: npx create-react-app my-app
  correct: npx --yes create-react-app my-app
  reason: skip "Ok to proceed?" prompt

npm_init:
  wrong: npm init
  correct: npm init -y
  reason: skip questionnaire

vue_create:
  wrong: vue create my-app
  correct: vue create my-app --default
  reason: skip interactive preset selection

ng_new:
  wrong: ng new my-app
  correct: ng new my-app --skip-confirmation --defaults
  reason: skip Angular CLI prompts

yarn_create:
  wrong: yarn create vite
  correct: yarn create vite --non-interactive
  reason: yarn respects --non-interactive

pnpm_create:
  correct: pnpm create vite app --template react-ts
  reason: pnpm is non-interactive by default
```

## Detection Pattern

If a command times out with output showing:
- `◆` or `│` (prompts UI)
- `? ` prefix (inquirer.js)
- `(y/N)` or `[Y/n]` (confirmation)

Then: Add the tool's non-interactive flag.

## Files to Update

When fixing a CLI interactive issue:
1. `.openhands/microagents/*.md` - command examples in microagents
2. `atoms_plus/roles/*.py` - role instruction strings
3. `.claude/skills/*/SKILL.md` - skill documentation

