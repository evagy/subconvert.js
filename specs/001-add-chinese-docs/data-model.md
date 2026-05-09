# Data Model: 中文文档

**Feature**: 增加中文文档
**Date**: 2026-05-09

本文档特性不涉及传统数据结构，以下描述文档实体的内容模型。

## 实体: 中文 README (`README_zh-CN.md`)

| 属性 | 说明 |
|------|------|
| **格式** | Markdown (CommonMark) |
| **编码** | UTF-8 无 BOM |
| **语言** | 简体中文 (zh-CN) |
| **章节结构** | 与英文 README.md 一一对应 |
| **代码块** | 保持原文不翻译 |

### 章节映射

| 英文 README 章节 | 中文章节 |
|------------------|---------|
| `# subconvert.js` | `# subconvert.js`（标题保留） |
| `## Features` | `## 功能特性` |
| `## Installation` | `## 安装` |
| `## Quick Start` | `## 快速开始` |
| `## API Endpoints` | `## API 端点` |
| `## Configuration` | `## 配置` |
| `## External Configuration` | `## 外部配置` |
| `## Examples` | `## 使用示例` |
| `## Development` | `## 开发` |
| `## Supported Protocols` | `## 支持的协议` |
| `## License` | `## 许可证` |

## 关系

```
README.md (英文) ──双向链接──▶ README_zh-CN.md (中文)
     │                              │
     └──────── 同源内容 ─────────────┘
```

两个文件维护相同的章节结构，内容语言不同。英文 README 顶部添加中文文档入口链接，中文 README 顶部添加英文文档入口链接。
