# 版本管理说明

## 自动打 Tag 机制

项目使用 GitHub Actions 实现自动版本管理，配置文件：`.github/workflows/auto-tag.yml`

### 触发条件

- Push 到 `main` 分支时自动触发
- 排除 `package.json` 更改（避免版本更新导致循环触发）

### 执行流程

1. 读取 `package.json` 中的当前版本号
2. 检查对应的 tag（如 `v0.1.0`）是否已存在
3. **如果 tag 已存在**：自动递增 patch 版本（`0.1.0` → `0.1.1`），更新 `package.json` 并提交
4. **如果 tag 不存在**：直接使用当前版本
5. 创建并推送新 tag
6. 自动创建 GitHub Release（带自动生成的 release notes）

### Tag 命名规则

格式：`v{major}.{minor}.{patch}`

示例：`v0.1.0`、`v0.1.1`、`v0.2.0`、`v1.0.0`

## 手动控制版本

自动流程只递增 patch 版本。如需升级 minor 或 major 版本，手动操作：

```bash
# 升级 patch: 0.1.0 → 0.1.1（通常自动完成）
npm version patch --no-git-tag-version

# 升级 minor: 0.1.x → 0.2.0
npm version minor --no-git-tag-version

# 升级 major: 0.x.x → 1.0.0
npm version major --no-git-tag-version
```

然后提交并推送：

```bash
git add package.json
git commit -m "chore: bump version to x.x.x"
git push
```

GitHub Actions 会自动基于新版本创建 tag。

## 注意事项

1. **不要手动创建 tag**：让 GitHub Actions 统一管理，避免版本混乱
2. **版本回退**：如需回退，先删除远程 tag，再修改 `package.json` 版本号
3. **跳过自动打 tag**：在 commit message 中包含 `[skip ci]` 可跳过所有 workflows
