---
name: Debug Log Remediator Guardrails
description: "Use when handling runtime debugging loops, debug.log triage, and one-root-cause patching with git/CLI safety constraints. Trigger phrases: debug.log, runtime error, stage patch, commit confirmation, aws, firebase."
applyTo:
  - "implementationdebugmcp.ts"
  - "src/**/*.{ts,tsx,js,jsx}"
  - "services/**/*.js"
  - "mcp-debug-gateway/src/**/*.{ts,tsx,js,jsx}"
  - ".github/agents/debug-log-remediator.agent.md"
  - ".github/agents/single-root-cause-reviewer.agent.md"
  - ".github/prompts/debug-log-remediator-loop.prompt.md"
---
# Debug Loop Guardrails

- Treat user-provided runtime evidence as the only trigger to continue cycles.
- Fix only one root cause per cycle; defer unrelated issues.
- Use the smallest possible patch and avoid broad refactors.

# Git Safety

- Do not run `git commit` or `git push` unless the user explicitly confirms.
- You may stage files and draft a commit message proposal while waiting for confirmation.
- Stage only files related to the current root-cause fix.

# CLI Safety

- Allowed runtime-debug binaries by default: `aws`, `firebase`, `npm`, `node`.
- Before AWS commands, run `command -v aws`.
- Before Firebase commands, run `command -v firebase`.
- If auth/profile/region/project context is missing, report exactly what is missing.

# File Operation Safety

- Ask for explicit confirmation before deleting files.
- Ask for explicit confirmation before large-scale edits across unrelated modules.
