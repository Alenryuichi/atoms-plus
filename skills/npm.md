---
name: npm
type: knowledge
version: 1.0.1
agent: CodeActAgent
triggers:
- npm
- npx
- create-vite
- create-next-app
- create-vue
- create-nuxt
---

## Non-Interactive npm/npx Commands

When using npm or npx in a sandbox environment, commands may hang waiting for user input.

### Best Practice: Prefer the tool's real non-interactive flag

For `create-vite`, use `--no-interactive`. `--yes` is not enough to bypass
the newer Vite beta prompt in sandbox environments.

```bash
# ✅ Correct - create-vite must use --no-interactive
npm create vite@latest my-app -- --template react-ts --no-interactive

# ✅ Correct - npx create-vite should also use --no-interactive
npx create-vite@latest my-app --template react-ts --no-interactive

# ✅ Correct - Next.js app
npx --yes create-next-app@latest my-app --typescript --tailwind --app

# ✅ Correct - Vue app
npx --yes create-vue@latest my-app

# ❌ Wrong - can still hang on Vite beta confirmation
npm create vite@latest my-app --yes -- --template react-ts

# ❌ Wrong - will hang waiting for interactive prompts
npx create-vite@latest my-app --template react-ts
```

### Alternative: Use `yes` pipe (fallback)

If `--yes` is not available, pipe `yes` command:

```bash
yes | npm install
```

### Timeout Considerations

- Default soft timeout is 30 seconds
- For package installation, set longer timeout:
  ```bash
  # Set timeout to 120 seconds for npm install
  timeout 120
  ```
