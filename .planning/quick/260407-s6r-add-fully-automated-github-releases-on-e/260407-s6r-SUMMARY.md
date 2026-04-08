---
phase: quick
plan: 260407-s6r
subsystem: ci/release
tags: [semantic-release, github-actions, ci, release-automation]
dependency_graph:
  requires: []
  provides: [automated-github-releases]
  affects: [.github/workflows/ci.yml]
tech_stack:
  added: [semantic-release@^24.0.0, "@semantic-release/github@^11.0.0"]
  patterns: [conventional-commits, automated-versioning]
key_files:
  created:
    - package.json
    - package-lock.json
    - .releaserc.json
  modified:
    - .github/workflows/ci.yml
decisions:
  - Use semantic-release v24 with commit-analyzer + release-notes-generator + github plugins only (no npm publish, no git-back commits)
  - tagFormat v${version} matches existing v1.0/v1.1/v1.2 convention
  - Release job scoped with job-level permissions: contents: write (not workflow-level)
  - fetch-depth: 0 on checkout so semantic-release can traverse full tag history
metrics:
  duration: 8m
  completed: 2026-04-07
  tasks_completed: 3
  files_created: 3
  files_modified: 1
---

# Quick Task 260407-s6r: Add Fully Automated GitHub Releases Summary

**One-liner:** Semantic-release v24 wired into CI with conventional-commit analysis, version bumping from existing v1.0/v1.1/v1.2 tags, and fat JAR upload on master push.

## What Was Done

Added fully automated GitHub releases driven by conventional commits using semantic-release.

Every green push to master now:
1. Analyzes commits since the last tag to determine release type (feat=minor, fix=patch, breaking=major; chore/docs/test/style=skip)
2. Builds the fat JAR via separate Gradle invocations (as required by CLAUDE.md)
3. Creates a GitHub release with the JAR attached as `planningpoker.jar`
4. Pushes a version tag following the existing `v{major}.{minor}.{patch}` convention

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create root package.json and semantic-release config | 77329c2 | package.json, .releaserc.json, package-lock.json |
| 2 | Add release job to CI workflow | 15e95ba | .github/workflows/ci.yml |
| 3 | Dry-run validation | (no files changed) | — |

## Dry-Run Result

```
semantic-release version 24.2.9
Loaded plugin "verifyConditions" from "@semantic-release/github"
Loaded plugin "analyzeCommits" from "@semantic-release/commit-analyzer"
Loaded plugin "generateNotes" from "@semantic-release/release-notes-generator"
Loaded plugin "publish" from "@semantic-release/github"
This test run was triggered on the branch worktree-agent-acf092ca,
while semantic-release is configured to only publish from master,
therefore a new version won't be published.
```

Config is valid. The "not publishing" message is expected — the dry-run ran from the worktree branch, not master. The config correctly identifies master as the only release branch.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The release job uses the built-in `GITHUB_TOKEN` (scoped to the repository) with `contents: write` permission only. No external secrets or service accounts introduced.

## Self-Check: PASSED

- package.json: EXISTS
- .releaserc.json: EXISTS
- package-lock.json: EXISTS
- .github/workflows/ci.yml: modified with release job
- Commits 77329c2 and 15e95ba: FOUND in git log
