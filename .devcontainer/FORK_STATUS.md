# Fork Sync Status - Visual Summary

```
UPSTREAM (TryGhost/Headline)                 FORK (PublicLedger/ghostcms-headline-theme-fork)
====================================         =====================================================

73ee6a5 Update gscan to v6.4.1                     
24825fa Update pnpm to v11.9.0                      
9f6f8e7 chore: repeat zipper changes               
0239ada Update gscan to v6.4.0                      
09ca0e4 Update pnpm to v11.8.0                      
f50a9db Update actions/checkout to v7         Also     
89a0099 Update pnpm to v11.7.0                      
b07a121 Update CSS preprocessors v8.0.2            
b7cb221 Add archive export ignores                 
7cdb62b Update pnpm/action-setup digest            
4440a0f Fixed theme zips excluding docs            
5ea91e3 Added mirror gscan CI workflows            
61475c1 Added theme CI gates docs                  
bf2f1b9 Update pnpm to v11.6.0                      
32c09de Update gscan to v6.3.0                      
3e654e6 Update pnpm to v11.5.3                      
4105ee4 Update pnpm to v11.5.2                      
a1dcc48 Per-theme build-script policy              
0fe7425 Rebuilt assets for pnpm layout             
277b173 Changed package manager to pnpm ──┐        
                                           │        
87d56c3 (FORK DIVERGENCE POINT)           │        87d56c3 chore: update cssnano v7.1.8
a09104e Update postcss to v8.5.13          │        a09104e (same)
65e491b Update postcss to v8.5.12          │        65e491b (same)
59b9d85 Update cssnano to v7.1.7           │        59b9d85 (same)
                                           │        
                                           └──────► a7afb07 GitHub deploy action; gitignore pattern
                                                    1dc0eec remove unnecessary entries from .gitignore
                                                    5e136ac Update localization strings (CUSTOM)
                                                    8b3c074 chore: update GitHub Actions workflow
                                                    0aaccc5 chore: add permissions section (v1.0.0-4)
                                                    
                                                    [UNCOMMITTED - NEW DEVCONTAINER SETUP]
                                                    - .devcontainer/ (complete setup)
                                                    - DEVCONTAINER.md
                                                    - .dockerignore
                                                    - routes.yaml
                                                    - Modified: README.md, package.json
```

## Statistics

| Metric | Value |
|--------|-------|
| **Fork is AHEAD by** | 5 commits (custom changes) |
| **Fork is BEHIND by** | ~19 commits (upstream updates) |
| **Uncommitted changes** | 6 files (devcontainer setup) |
| **Last common commit** | 87d56c3 (cssnano v7.1.8) |
| **Upstream's latest** | 73ee6a5 (gscan v6.4.1) |

## Key Differences

### Major Divergences

1. **Package Manager**
   - Upstream: pnpm@11.9.0 (switched at 277b173)
   - Fork: Still using npm/yarn

2. **Dependencies**
   - Upstream: gscan 6.4.1, cssnano 8.x, latest tools
   - Fork: gscan 5.4.3, cssnano 7.1.8, older versions

3. **Custom Features (Fork Only)**
   - GitHub Actions deployment workflow
   - Custom localization strings
   - Custom package metadata (PublicLedger branding)
   - **NEW:** Complete devcontainer environment

4. **Files Unique to Fork**
   - `.github/workflows/deploy-theme.yaml`
   - `.gitignore`
   - `.nvmrc`
   - `.devcontainer/` (new)
   - `DEVCONTAINER.md` (new)
   - `.dockerignore` (new)

## Conflict Likelihood

```
FILE                        CONFLICT RISK    REASON
====================        =============    ======================================
package.json                ⚠️  HIGH         Both changed metadata + dependencies
locales/en.json             ⚡ MODERATE      Fork has custom strings
assets/built/*              ⚡ MODERATE      Both modified (but auto-generated)
.github/workflows/*         ✅ LOW           Only in fork
.gitignore                  ✅ LOW           Only in fork
.devcontainer/*             ✅ NONE          Only in fork (new)
*.hbs templates             ✅ NONE          No changes in either
gulpfile.js                 ⚡ MODERATE      Upstream updated zipper function
```

## Recommended Action Path

```
1. ✅ COMMIT devcontainer changes
   └─> Current uncommitted work

2. 🔀 SYNC with origin/main
   └─> Pull 2 commits fork is behind

3. 💾 CREATE backup branch
   └─> Safety net for rollback

4. 🔄 REBASE onto upstream/main
   └─> Replay fork's 5 commits on top of upstream's ~19

5. 🛠️  RESOLVE conflicts
   └─> package.json: Manual merge
   └─> locales/en.json: Keep fork strings
   └─> assets/built/: Take upstream, rebuild

6. 📦 MIGRATE to pnpm
   └─> Remove yarn.lock
   └─> Install with pnpm
   └─> Update devcontainer
   └─> Update GitHub Actions

7. ✅ TEST thoroughly
   └─> Build, validate, devcontainer

8. 🚀 MERGE to main and push
```

## Time Estimate

- **Preparation:** 15 min
- **Merge/Rebase:** 45 min
- **Conflict Resolution:** 30-45 min
- **pnpm Migration:** 20 min
- **Testing:** 60 min
- **Documentation:** 15 min

**Total:** 2.5-3.5 hours

---

*Generated: 2026-06-28*  
*See [UPSTREAM_SYNC_PLAN.md](UPSTREAM_SYNC_PLAN.md) for detailed strategy*  
*See [UPSTREAM_SYNC_COMMANDS.md](UPSTREAM_SYNC_COMMANDS.md) for command reference*
