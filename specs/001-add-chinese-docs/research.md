# Research: 中文文档最佳实践

**Feature**: 增加中文文档
**Date**: 2026-05-09

## 决策 1: 文件命名规范

**Decision**: 使用 `README_zh-CN.md` 作为中文文档文件名

**Rationale**: 
- 遵循 IETF BCP 47 语言标签规范，`zh-CN` 表示简体中文（中国大陆）
- GitHub 社区广泛采用此命名惯例（如 `README_zh-CN.md`、`CONTRIBUTING_zh-CN.md`）
- 与 GitHub Linguist 的自动语言检测兼容

**Alternatives considered**:
- `README.zh.md` — 不够精确，无法区分简体和繁体
- `README_CN.md` — 非标准语言标签
- `README-zh.md` — 可接受但 `_` 分隔符在社区中更常见

## 决策 2: 技术术语翻译对照表

**Decision**: 统一采用以下术语翻译规范，全文保持一致

**Rationale**: 中文代理/网络社区已形成通用术语习惯，遵循社区惯例可降低用户理解成本

| English | 中文 | 备注 |
|---------|------|------|
| proxy | 代理 | 不译为"代理服务器"以保持简洁 |
| subscription | 订阅 | |
| node / server | 节点 | 不译为"服务器" |
| rule set | 规则集 | |
| proxy group | 代理组 | |
| routing | 分流 / 路由 | 二选一，本项目统一用"分流" |
| fallback | 故障转移 | |
| URL test | 延迟测试 | |
| emoji | 表情符号 / Emoji | 保留英文 Emoji 也可接受 |
| upstream | 上游 | |
| endpoint | 端点 | |
| health check | 健康检查 | |

## 决策 3: 代码与命令的处理

**Decision**: 代码块、bash 命令、URL、文件路径保持原文不翻译；仅翻译代码块周围的说明文字和注释

**Rationale**:
- 命令和代码必须可复制执行，翻译会破坏可用性
- 代码内的注释可选择性翻译（在代码块外以说明文字补充）

## 决策 4: Markdown 编码规范

**Decision**: 使用 UTF-8 编码（无 BOM），遵循标准 CommonMark 规范

**Rationale**:
- GitHub 原生支持 UTF-8 中文 Markdown
- 无需特殊设置，跨平台兼容
