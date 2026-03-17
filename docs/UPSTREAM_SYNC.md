# Upstream Sync Guide

This repository is a fork of [liujuntao123/smart-draw](https://github.com/liujuntao123/smart-draw) with English UI translations.

## Automated Sync

A GitHub Actions workflow runs weekly to check for upstream changes:
- **Workflow:** `.github/workflows/sync-upstream.yml`
- **Schedule:** Every Monday at 9:00 UTC
- **Manual trigger:** Actions → "Sync Upstream" → Run workflow

### What happens:

1. **No conflicts:** A PR is automatically created with upstream changes
2. **Conflicts detected:** An issue is created with instructions for manual merge

## Manual Sync Process

```bash
# 1. Fetch upstream changes
git fetch upstream

# 2. Create a sync branch
git checkout -b sync/upstream-$(date +%Y%m%d)

# 3. Merge upstream
git merge upstream/main

# 4. If conflicts, resolve them (see below)

# 5. Run translation check
./scripts/check-translations.sh

# 6. Commit and push
git push origin sync/upstream-$(date +%Y%m%d)

# 7. Create PR
```

## Resolving Translation Conflicts

When upstream adds new Chinese UI text, you need to translate it.

### Files likely to have conflicts:

| File | Contains |
|------|----------|
| `components/AppHeader.jsx` | Header buttons, tooltips |
| `components/FloatingChat.jsx` | Chat UI, chart types, example prompts |
| `components/ConfigModal.jsx` | Settings labels |
| `components/HistoryModal.jsx` | History UI |
| `lib/constants.js` | Chart type names |
| `app/api/**/route.js` | Error messages |

### Translation patterns:

```javascript
// Chinese (upstream)
title: '配置设置'

// English (our fork)
title: 'Configuration Settings'
```

### Common translations:

| Chinese | English |
|---------|---------|
| 配置 | Configuration / Settings |
| 保存 | Save |
| 取消 | Cancel |
| 删除 | Delete |
| 确认 | Confirm |
| 错误 | Error |
| 成功 | Success |
| 加载中 | Loading |
| 应用 | Apply |
| 复制 | Copy |
| 历史记录 | History |
| 新建 | New / Create |
| 导入 | Import |
| 导出 | Export |

## CI Checks

The `check-translations.yml` workflow runs on every PR and push to verify:

1. No Chinese UI text in protected files
2. Key English strings are present

## Intentional Chinese Text

The following Chinese text is **intentional** and should NOT be translated:

- `components/LandingPage.jsx` - The `zh` translation object (for language switcher)
- Code comments - Developer notes in Chinese are acceptable

## Release Process

1. Sync upstream (weekly or as needed)
2. Resolve any translation conflicts
3. Verify CI checks pass
4. Merge sync PR to main
5. Create release tag: `git tag v1.x.x && git push --tags`

## Questions?

If you're unsure about a translation, check:
1. The context in the original Chinese code
2. Similar patterns already translated in our codebase
3. Common UI terminology in English apps
