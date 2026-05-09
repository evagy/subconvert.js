# Feature Specification: 增加中文文档

**Feature Branch**: `001-add-chinese-docs`
**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "增加中文文档"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 阅读中文项目文档 (Priority: P1)

一位中文用户在 GitHub 上发现本项目，希望阅读中文文档来了解项目功能、安装方式和使用方法。该用户打开中文 README 后，能够在 5 分钟内了解项目的核心功能并成功完成首次安装和运行。

**Why this priority**: 项目核心用户群体为中文用户（代理订阅转换工具的主要使用场景在中国大陆及中文社区），中文文档是用户上手的第一入口，直接影响项目的可访问性和采用率。

**Independent Test**: 找一位不熟悉本项目的开发者，仅通过阅读中文 README 完成安装和首次订阅转换请求，验证其是否能独立完成。

**Acceptance Scenarios**:

1. **Given** 用户访问项目仓库首页，**When** 用户打开中文 README 文件，**Then** 用户能看到完整的中文项目介绍、功能特性列表、安装步骤和快速开始指南
2. **Given** 用户需要配置服务器，**When** 用户阅读中文文档中的配置章节，**Then** 用户能理解每个配置项的含义并正确编辑配置
3. **Given** 用户想使用 API 进行订阅转换，**When** 用户查阅中文文档的 API 章节，**Then** 用户能找到所有端点、参数说明和使用示例

---

### User Story 2 - 查阅中文配置参考 (Priority: P2)

用户在使用过程中需要查阅配置文件（pref.ini）中各个选项的含义，以及 emoji 规则、代理组规则、分流规则的编写方式。中文配置参考文档应提供每个配置节的详细说明和示例。

**Why this priority**: 配置是用户日常使用中最常查阅的部分，正确的配置直接影响转换结果。英文配置说明可能阻碍用户正确配置高级功能。

**Independent Test**: 用户查阅中文配置文档后，能够独立完成自定义 emoji 规则、代理分组和分流规则的配置。

**Acceptance Scenarios**:

1. **Given** 用户打开中文配置文档，**When** 用户查找 `[emojis]` 配置节，**Then** 用户能看到 emoji 规则的格式说明、正则匹配原理和多个实用示例
2. **Given** 用户需要创建代理分组，**When** 用户查阅 `[proxy_groups]` 配置节，**Then** 用户能理解 select/url-test/fallback 三种分组类型的语法和用法
3. **Given** 用户需要添加分流规则，**When** 用户查阅 `[rulesets]` 配置节，**Then** 用户能理解远程规则集和本地规则的编写方式

---

### User Story 3 - 获取中文 API 参考 (Priority: P3)

开发者在集成 subconverter 到自己的工具或服务时，需要中文版 API 参考文档来了解每个端点的参数、返回值和支持的格式枚举。

**Why this priority**: API 集成面向开发者群体，英文文档可作为基础理解，中文 API 文档降低中文开发者的接入门槛，但优先级低于面向所有用户的 README 和配置文档。

**Independent Test**: 开发者仅凭中文 API 参考文档完成一个自动化脚本，调用 `/sub` 端点进行格式转换并正确处理返回结果。

**Acceptance Scenarios**:

1. **Given** 开发者打开中文 API 文档，**When** 开发者查找 `/sub` 端点，**Then** 开发者能看到所有参数的完整列表（包含类型、是否必填、示例值）
2. **Given** 开发者需要了解支持的输出格式，**When** 开发者查阅 API 文档的格式列表，**Then** 开发者能看到所有 target 参数的合法取值及对应描述

---

### Edge Cases

- 当英文原版文档更新后，如何保持中文文档同步？（建议通过 PR review 流程确保同步）
- 中英文技术术语翻译不一致时如何处理？（术语统一策略）
- 如何处理 README 中嵌入的代码示例和命令行（是否翻译注释？）
- 中文 Markdown 文件在不同操作系统和编辑器中的编码和渲染兼容性

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 项目 MUST 提供一份完整的中文版 README（命名为 `README_zh-CN.md`），涵盖英文 README 中的所有章节
- **FR-002**: 中文文档 MUST 覆盖以下核心内容：项目介绍、功能特性、安装步骤、快速开始、API 端点说明、配置文件参考、开发指南
- **FR-003**: 中文文档中的代码示例和 bash 命令 MUST 保持可执行状态（不翻译命令和代码，仅翻译注释和说明文字）
- **FR-004**: 中文文档 MUST 在英文 README（或仓库首页）中有明确的中文文档入口链接
- **FR-005**: 中文文档 MUST 使用通用技术术语翻译规范，确保与中文代理/网络社区的习惯用法一致（如 "proxy" 译为 "代理"，"subscription" 译为 "订阅"）
- **FR-006**: 配置文件参考文档 MUST 提供所有配置节的完整中文说明，包括 `[common]`、`[node_pref]`、`[server]`、`[emojis]`、`[rename_remarks]`、`[proxy_groups]`、`[rulesets]`
- **FR-007**: 中文文档中的 API 参数表 MUST 包含参数的中文描述，帮助用户理解每个参数的作用

### Key Entities

- **中文 README 文档**: 英文 README.md 的完整中文对应版本，包含相同的章节结构和信息内容，但以中文撰写说明文字
- **配置文件参考**: pref.ini 各配置节的中文说明文档，解释每个配置项的含义、可选值和示例
- **API 参考文档**: 所有 HTTP 端点及参数的中文说明

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 中文用户能够在 5 分钟内通过阅读中文文档完成项目的首次安装和运行
- **SC-002**: 中文文档覆盖英文 README 100% 的章节内容，无信息遗漏
- **SC-003**: 中文文档中的所有命令和代码示例可直接复制执行，无需用户手动修正
- **SC-004**: 中文文档发布后，中文用户提交的"如何使用"类 issue 数量减少
- **SC-005**: 文档中的技术术语在全文范围内保持一致（无同一英文术语对应多种中文翻译的情况）

## Assumptions

- 目标用户群体主要为中文母语者，熟悉代理/网络工具的基本概念
- 中文文档将以独立文件形式存在于仓库中（`README_zh-CN.md`），与英文 README 并列
- 文档使用 Markdown 格式，与项目现有文档格式保持一致
- 首次版本聚焦于 README 的完整翻译，后续可扩展其他文档的中文版本
- 技术术语翻译遵循中文代理社区的通用习惯
- 代码块、命令、URL、文件路径等内容保持原文不翻译
