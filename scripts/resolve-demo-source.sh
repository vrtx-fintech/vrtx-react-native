#!/usr/bin/env bash
set -euo pipefail
sha="$GITHUB_SHA"
source_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/commit/$sha"
preview=true
if [[ -n "$PR_NUMBER" ]]; then
  if [[ ! "$PR_NUMBER" =~ ^[1-9][0-9]*$ ]]; then
    echo '::error::pr_number must be a positive integer.'
    exit 1
  fi
  pr=$(gh api "repos/$GITHUB_REPOSITORY/pulls/$PR_NUMBER")
  if [[ "$(jq -r '.state' <<< "$pr")" != open || "$(jq -r '.head.repo.full_name' <<< "$pr")" != "$GITHUB_REPOSITORY" ]]; then
    echo '::error::Choose an open PR from this repository. Fork PR code cannot run with distribution secrets.'
    exit 1
  fi
  sha=$(jq -r '.head.sha' <<< "$pr")
  source_url=$(jq -r '.html_url' <<< "$pr")
elif [[ "$GITHUB_REF" == refs/heads/main ]]; then
  preview=false
elif [[ "$GITHUB_REF" != refs/heads/* ]]; then
  echo '::error::Select main or a PR branch, or enter a PR number.'
  exit 1
fi
{
  echo "sha=$sha"
  echo "preview=$preview"
  echo "source_url=$source_url"
} >> "$GITHUB_OUTPUT"
