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

### Best Practice: Use `--yes` flag

Always use the `--yes` flag to skip interactive prompts:

```bash
# ✅ Correct - use --yes to skip "Ok to proceed?" prompt
npx --yes create-vite@latest my-app --template react-ts

# ✅ Correct - npm create with --yes
npm create vite@latest my-app --yes -- --template react-ts

# ✅ Correct - Next.js app
npx --yes create-next-app@latest my-app --typescript --tailwind --app

# ✅ Correct - Vue app
npx --yes create-vue@latest my-app

# ❌ Wrong - will hang waiting for "y" input
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
