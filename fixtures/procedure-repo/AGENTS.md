# procedure-heavy-fixture

## Overview

Tiny fixture with a long deploy runbook that should become a skill.

## Commands

```bash
npm test
```

## Deploy runbook

1. Ensure `main` is green in CI.
2. Bump the version in `package.json` with a patch bump only.
3. Run `npm run build` and fix any type errors before continuing.
4. Tag the release as `vX.Y.Z` matching package.json.
5. Push the tag to origin (never force-push tags).
6. Publish to npm with `npm publish --access public`.
7. Open a GitHub release notes draft from the tag.
8. Announce in the team channel with the changelog link.
9. Verify the published package installs cleanly in a fresh folder.
10. Close the release checklist issue.

## Do not

- Do not commit secrets

