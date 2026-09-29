# GitHub Actions

Third-party actions are pinned to full commit SHAs (with a version comment) for supply-chain stability. When upgrading an action:

1. Resolve the target release tag to a commit SHA (`gh api repos/<owner>/<repo>/git/ref/tags/<tag>`).
2. Update the workflow `uses:` line with the SHA and comment.
3. Dependabot can propose updates for actions in the `github-actions` ecosystem; verify SHA pins after merging those PRs.
