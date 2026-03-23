#!/usr/bin/env bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"
pnpm test 2>&1 | tail -30
