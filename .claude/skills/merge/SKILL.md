---
name: merge
description: Create a PR from the current branch to main and merge it. Use when the user says "merge", "merge to main", "create PR", or wants to get their changes into main without a full deploy.
argument-hint: [--no-delete]
---

# Merge Skill

You merge the current feature branch into `main` via a GitHub Pull Request.

## Prerequisites

- The GitHub token is available as `$DEPLOY_GITHUB_TOKEN` (from `~/.claude/settings.json` env vars).
- The repo info is in `.claude/deploy.json` field `github_repo`. **Read this file first.**

## Steps

### 1. Read config and detect context

Read `.claude/deploy.json` to get `github_repo`.

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

- If the current branch is `main`, **stop** and tell the user: "You're already on main. Switch to a feature branch first."
- If there are uncommitted changes, **stop** and tell the user: "You have uncommitted changes. Commit or stash them first."

### 2. Push the branch

Push the current branch to the remote:

```bash
git push -u origin "$CURRENT_BRANCH"
```

If push fails with 403, it means the branch name doesn't match the allowed pattern. Inform the user.

Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network errors only.

### 3. Create the Pull Request

Use the GitHub API directly with curl (do NOT rely on `gh` being installed):

```bash
curl -s -X POST \
  -H "Authorization: token $DEPLOY_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/pulls" \
  -d "{
    \"title\": \"Merge $CURRENT_BRANCH into main\",
    \"head\": \"$CURRENT_BRANCH\",
    \"base\": \"main\",
    \"body\": \"Automated PR created by /merge skill.\"
  }"
```

Extract the PR number from the response. If a PR already exists for this branch, use the existing one (look for error message "A pull request already exists" and search for the existing PR).

### 4. Merge the Pull Request

Use the GitHub API to merge:

```bash
curl -s -X PUT \
  -H "Authorization: token $DEPLOY_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/pulls/$PR_NUMBER/merge" \
  -d "{
    \"merge_method\": \"squash\"
  }"
```

If merge fails due to conflicts, **stop** and tell the user to resolve conflicts first.

### 5. Clean up

Unless the user passed `--no-delete`:

1. Switch to main locally: `git checkout main`
2. Pull latest: `git pull origin main`
3. Delete the local feature branch: `git branch -d "$CURRENT_BRANCH"`
4. Delete the remote feature branch:

```bash
curl -s -X DELETE \
  -H "Authorization: token $DEPLOY_GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO/git/refs/heads/$CURRENT_BRANCH"
```

### 6. Confirm

Print a summary:
- PR number and URL
- Merge status (squash merged)
- Branch cleanup status

## Error Handling

- **No commits ahead of main**: Tell the user there's nothing to merge.
- **Merge conflicts**: Tell the user to resolve conflicts locally, push again, and re-run `/merge`.
- **Network errors on push/API calls**: Retry up to 4 times with exponential backoff.
- **403 on push**: Branch name not allowed — inform the user.
- **PR already merged**: Inform the user and skip to cleanup.
