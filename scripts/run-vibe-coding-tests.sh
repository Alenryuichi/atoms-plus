#!/bin/bash
# ============================================================================
# Vibe Coding E2E Test Runner with Formatted Report
# ============================================================================
# Usage:
#   ./scripts/run-vibe-coding-tests.sh              # Run standard tests
#   ./scripts/run-vibe-coding-tests.sh --full       # Include full flow tests
#   ./scripts/run-vibe-coding-tests.sh --prod       # Test against production
#   ./scripts/run-vibe-coding-tests.sh --full --prod # Both options
# ============================================================================

# Parse arguments
FULL_FLOW=""
USE_PROD=""
for arg in "$@"; do
  case $arg in
    --full) FULL_FLOW="1" ;;
    --prod) USE_PROD="1" ;;
  esac
done

# Set environment variables
export TEST_VIBE_CODING=1
[ -n "$FULL_FLOW" ] && export TEST_FULL_FLOW=1
[ -n "$USE_PROD" ] && export TEST_PROD=1

# Determine environment
if [ -n "$USE_PROD" ]; then
  ENV="PRODUCTION"
  BACKEND="https://openhands-production-c7c2.up.railway.app"
  FRONTEND="https://frontend-ten-beta-79.vercel.app"
else
  ENV="LOCAL"
  BACKEND="http://localhost:3000"
  FRONTEND="${LOCAL_FRONTEND_URL:-http://localhost:3002}"
fi

cd "$(dirname "$0")/../frontend"

# Print header
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                     🧪 VIBE CODING E2E TEST RUNNER                           ║"
echo "╠══════════════════════════════════════════════════════════════════════════════╣"
printf "║  %-76s ║\n" "Environment: $ENV"
printf "║  %-76s ║\n" "Backend: $BACKEND"
printf "║  %-76s ║\n" "Frontend: $FRONTEND"
printf "║  %-76s ║\n" "TEST_FULL_FLOW: ${FULL_FLOW:-0}"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Run tests with list reporter for detailed output
npx playwright test tests/vibe-coding-e2e.spec.ts --project=chromium --reporter=list

# Capture exit code
EXIT_CODE=$?

# Print footer
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
if [ $EXIT_CODE -eq 0 ]; then
  echo "║  ✅ ALL TESTS COMPLETED SUCCESSFULLY                                         ║"
else
  echo "║  ❌ SOME TESTS FAILED                                                         ║"
fi
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

exit $EXIT_CODE

