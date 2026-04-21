## Summary

<!-- What does this PR change and why? One paragraph is fine. -->

## Test plan

<!-- How did you verify? Check off everything that applies. -->

- [ ] `npm run lint && npm run format:check` (frontend)
- [ ] `./gradlew spotlessCheck` (backend)
- [ ] `npm test` (Vitest)
- [ ] `./gradlew planningpoker-api:test` (JUnit)
- [ ] `npx playwright test` (E2E — required for UI/behaviour changes)
- [ ] Manual smoke test in a local dev server (for UI changes)

## Notes

<!-- Anything reviewers should focus on, follow-ups, migration steps, etc. -->

---

Uses [Conventional Commits](https://www.conventionalcommits.org/) — `fix:` for patches, `feat:` for minor, `!` or `BREAKING CHANGE:` for major. `chore:` / `docs:` / `test:` / `refactor:` do not trigger a release.
