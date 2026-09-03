#!/bin/bash
set -e

# CI Upstream Sync Helper
#
# Non-interactive counterpart to sync/upstream-sync.sh, used only by the
# "upstream-sync-check" job in .github/workflows/validate-fork.yaml. Merges
# upstream/main into a stable branch and validates the result; the caller
# (the workflow, or a maintainer running this by hand) decides whether to
# push it. This script never pushes, never opens a PR, and never touches
# `staging` itself -- all it does is build the candidate branch.
#
# Usage: ./scripts/ci-upstream-sync.sh
# Must be run from the repo root, on a clean checkout of `staging`.

UPSTREAM_REPO="https://github.com/TryGhost/Headline.git"
UPSTREAM_REMOTE="upstream"
SYNC_BRANCH="upstream-sync/staging"

# Structurally merges a conflicted package.json: take ours (stage :2)
# wholesale, then overlay upstream's (stage :3) packageManager and
# devDependencies. "Fork-only" dependencies are derived at merge time as
# "any key ours has that theirs doesn't" rather than kept in a hardcoded
# list here -- a hardcoded list of eslint*/prettier*/etc. missed
# postcss-nested (fork-only, required by gulpfile.js, but not covered by
# package.json's own "_comment_devDependencies" wildcard description) the
# first time this ran against a real conflict, which would have silently
# dropped it and broken the next `pnpm install`. Deriving it from the
# actual diff can't go stale the same way: worst case it keeps a
# dependency upstream has since dropped (harmless clutter), instead of
# silently deleting one the fork still needs (broken build).
# package.json's indentation matches upstream's own 4-space style (verified
# against upstream/main:package.json), so --indent 4 here isn't a fork
# preference, it's staying consistent with upstream to keep future diffs
# small -- the same reason package.json is prettier-ignored.
#
# Two assertions guard against upstream someday restructuring package.json
# in a way this rule doesn't anticipate: if either fires, this function
# fails and the caller falls back to today's abort-and-fail-red path
# instead of silently landing a wrong merge.
# NOTE: this function (and its caller) run on the right-hand side of `||` /
# inside an `if` condition, which disables `set -e` for their entire call
# tree -- bash's well-known gotcha where errexit doesn't propagate through
# conditional contexts. Every jq call below is therefore checked explicitly
# with `if ! ...; then return 1; fi` rather than trusting `set -e` to catch
# a failure -- a silent jq crash must never be mistaken for "assertion
# passed", which is exactly what happened here originally (a filter typo
# made jq exit non-zero on the ours-json side of the drop-check, and with
# `set -e` disabled, the empty output was silently read as "nothing missing").
resolve_package_json() {
    local ours_json theirs_json merged_json missing ours_rest merged_rest
    ours_json=$(mktemp)
    theirs_json=$(mktemp)
    merged_json=$(mktemp)

    git show :2:package.json > "$ours_json"
    git show :3:package.json > "$theirs_json"

    if ! jq empty "$ours_json" 2>/dev/null || ! jq empty "$theirs_json" 2>/dev/null; then
        echo "  package.json: one side is not valid JSON, cannot auto-resolve" >&2
        return 1
    fi

    if ! jq --indent 4 --slurpfile theirs "$theirs_json" '
        ($theirs[0]) as $t |
        .packageManager = $t.packageManager
        | .devDependencies = ($t.devDependencies * (.devDependencies | with_entries(select(.key as $k | ($t.devDependencies | has($k)) | not))))
    ' "$ours_json" > "$merged_json"; then
        echo "  package.json: jq merge failed" >&2
        return 1
    fi

    # Assertion 1: no dependency the fork had got dropped by the merge.
    if ! missing=$(jq -r --slurpfile merged "$merged_json" '
        ($merged[0].devDependencies) as $m
        | [.devDependencies | keys[] | select(. as $k | ($m | has($k)) | not)] | .[]
    ' "$ours_json"); then
        echo "  package.json: assertion check (dropped deps) failed to run" >&2
        return 1
    fi
    if [[ -n "$missing" ]]; then
        echo "  package.json: merge would drop dependencies: $(echo "$missing" | tr '\n' ' ')" >&2
        return 1
    fi

    # Assertion 2: nothing outside packageManager/devDependencies changed.
    # If it did, upstream's conflict touched something this rule doesn't
    # model -- fork identity fields, scripts, config -- and this function
    # has no business guessing at that.
    if ! ours_rest=$(jq -S 'del(.packageManager, .devDependencies)' "$ours_json"); then
        echo "  package.json: assertion check (ours) failed to run" >&2
        return 1
    fi
    if ! merged_rest=$(jq -S 'del(.packageManager, .devDependencies)' "$merged_json"); then
        echo "  package.json: assertion check (merged) failed to run" >&2
        return 1
    fi
    if [[ "$ours_rest" != "$merged_rest" ]]; then
        echo "  package.json: fields outside packageManager/devDependencies would change -- outside the auto-merge rule" >&2
        return 1
    fi

    cp "$merged_json" package.json
    git add package.json
}

# Inspects every conflicted path from the failed merge. If -- and only if --
# every single one is a pattern already known to be routine and safe
# (assets/built/* deleted-by-us, or package.json's version-bump conflict),
# resolve them and complete the merge commit. Returns 1 the moment anything
# doesn't fit, leaving the conflict exactly as git left it for the caller to
# abort and report.
resolve_known_conflicts() {
    local path unresolvable=0 package_json_conflict=0
    local -a assets_built_conflicts=()

    while IFS= read -r path; do
        if [[ "$path" == assets/built/* ]] && ! git cat-file -e ":2:$path" 2>/dev/null; then
            # Deleted on our side (the fork gitignores assets/built/ and
            # doesn't track build output), modified upstream. Always safe to
            # keep deleted: `pnpm zip` below regenerates it from real source
            # right after, and .gitignore keeps it from being re-added.
            assets_built_conflicts+=("$path")
        elif [[ "$path" == "package.json" ]] \
            && git cat-file -e ":2:$path" 2>/dev/null \
            && git cat-file -e ":3:$path" 2>/dev/null; then
            package_json_conflict=1
        else
            echo "  $path: not a recognized auto-resolvable conflict" >&2
            unresolvable=1
        fi
    done < <(git diff --name-only --diff-filter=U)

    [[ $unresolvable -eq 0 ]] || return 1

    for path in "${assets_built_conflicts[@]}"; do
        git rm -f "$path" > /dev/null || return 1
    done

    if [[ $package_json_conflict -eq 1 ]]; then
        resolve_package_json || return 1
    fi

    git commit --no-edit > /dev/null || return 1
}

if [[ ! -f "package.json" ]] || ! grep -q "publicledger-headline-fork" package.json; then
    echo "❌ Error: Not in the fork repository root" >&2
    exit 1
fi

if [[ -n $(git status -s) ]]; then
    echo "❌ Error: working directory is not clean" >&2
    git status -s >&2
    exit 1
fi

if ! git remote | grep -q "^${UPSTREAM_REMOTE}$"; then
    git remote add $UPSTREAM_REMOTE $UPSTREAM_REPO
fi
git fetch $UPSTREAM_REMOTE main

NEW_COMMITS=$(git rev-list --count HEAD..${UPSTREAM_REMOTE}/main)
if [[ $NEW_COMMITS -eq 0 ]]; then
    echo "✅ Already up-to-date with upstream, nothing to sync"
    exit 0
fi

echo "📊 Upstream has $NEW_COMMITS new commits"

# Recreate the branch fresh from HEAD every run. A stable (not date-suffixed)
# name is what lets a later run update the same open PR instead of opening a
# new one -- dev work on this theme is roughly monthly, so a sync candidate
# can sit unreviewed for weeks while more upstream commits land.
git branch -D "$SYNC_BRANCH" 2>/dev/null || true
git checkout -b "$SYNC_BRANCH"

echo "🔄 Merging ${UPSTREAM_REMOTE}/main..."
if ! git merge --no-edit ${UPSTREAM_REMOTE}/main; then
    echo "⚠️  Merge conflicts detected, checking whether they're routine..." >&2
    if resolve_known_conflicts; then
        echo "✅ Auto-resolved known conflict patterns (assets/built/*, package.json)"
    else
        echo "❌ Merge conflicts require manual resolution:" >&2
        git diff --name-only --diff-filter=U | sed 's/^/     /' >&2
        git merge --abort
        exit 1
    fi
fi

echo "🔨 Installing dependencies and rebuilding..."
pnpm install
pnpm zip

echo "✅ Running theme + fork validation..."
pnpm test
pnpm validate:fork

# The merge can leave the lockfile and assets/built/* regenerated but
# uncommitted (package.json changes upstream, rebuilt CSS/JS bundles).
if [[ -n $(git status -s) ]]; then
    git add -A
    git commit -m "chore: rebuild assets after upstream sync"
fi

echo "$SYNC_BRANCH"
