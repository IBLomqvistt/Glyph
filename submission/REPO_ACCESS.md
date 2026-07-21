# Repository visibility and access

## Current finding

As of 2026-07-21, this local Git repository has no commits and no configured remote. Its GitHub visibility and collaborator access therefore cannot be checked yet.

## Required final check

1. Record the canonical repository URL in `EVIDENCE.md`.
2. Open the repository settings and determine whether it is Public or Private.
3. If Private, grant access to:
   - `testing@devpost.com`
   - `build-week-event@openai.com`
4. Confirm both invitations were successfully created. If the platform requires invitation acceptance, record the actual status instead of assuming access.
5. Test repository accessibility from a signed-out browser or an account without owner privileges, as appropriate for its visibility.
6. Ensure install instructions and a no-rebuild test method are documented in the root README.

## Local verification commands

Run these from the repository root:

```sh
git remote -v
git status --short --branch
git log -1 --oneline
```

If the repository is hosted on GitHub and GitHub CLI is authenticated:

```sh
gh repo view --json nameWithOwner,url,visibility
```

Repository invitations are consequential external changes. After the remote exists, verify the exact repository and visibility before sending them, then capture non-sensitive evidence in `EVIDENCE.md`.

