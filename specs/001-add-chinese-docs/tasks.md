# Tasks: 增加中文文档

**Input**: Design documents from `/specs/001-add-chinese-docs/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not applicable — pure documentation feature, no code changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. All tasks produce sections within a single output file: `README_zh-CN.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Prepare Source Material)

**Purpose**: Ensure the English source README is fully understood before translation begins

- [x] T001 Read and analyze English README.md to identify all chapters, code blocks, and cross-references in README.md

---

## Phase 2: User Story 1 - 中文 README 核心章节 (Priority: P1) 🎯 MVP

**Goal**: 用户打开 README_zh-CN.md 后能在 5 分钟内了解项目功能并完成安装和首次运行

**Independent Test**: 找一位不熟悉本项目的开发者，仅通过阅读 README_zh-CN.md 完成 `npm install && npm run dev` 并发送一次订阅转换请求

### Implementation for User Story 1

- [x] T002 [US1] Write Chinese sections in README_zh-CN.md: 项目标题/简介 (header + intro paragraph, translated from README.md lines 1-3)
- [x] T003 [US1] Write Chinese section: 功能特性 (Features, translated from README.md lines 5-11) in README_zh-CN.md
- [x] T004 [US1] Write Chinese section: 安装 (Installation, translated from README.md lines 13-26) in README_zh-CN.md
- [x] T005 [US1] Write Chinese section: 快速开始 (Quick Start, translated from README.md lines 28-56) in README_zh-CN.md
- [x] T006 [US1] Write Chinese section: 开发指南 (Development — Project Structure + Run Tests + Build, translated from README.md lines 293-350) in README_zh-CN.md
- [x] T007 [US1] Write Chinese section: 支持的协议 (Supported Protocols, translated from README.md lines 347-357) and 许可证 (License) in README_zh-CN.md

**Checkpoint**: README_zh-CN.md now covers project intro, features, install, quick start, dev guide, protocols, and license — a new user can onboard from Chinese docs alone

---

## Phase 3: User Story 2 - 中文配置参考 (Priority: P2)

**Goal**: 用户查阅中文配置文档后能独立完成 emoji 规则、代理分组和分流规则的配置

**Independent Test**: 用户仅凭中文文档中的配置章节，编辑 pref.ini 添加自定义 emoji 规则、代理组和分流规则，重启服务后配置生效

### Implementation for User Story 2

- [x] T008 [US2] Write Chinese section: 配置 — [common] + [node_pref] + [server] sections (translated from README.md lines 134-162) in README_zh-CN.md
- [x] T009 [US2] Write Chinese section: Emoji 配置 (Emoji Configuration, translated from README.md lines 181-196) in README_zh-CN.md
- [x] T010 [US2] Write Chinese section: 代理组配置 (Proxy Group Configuration, translated from README.md lines 198-217) in README_zh-CN.md
- [x] T011 [US2] Write Chinese section: 规则集配置 (Ruleset Configuration, translated from README.md lines 219-232) + 外部配置 (External Configuration, translated from lines 234-242) in README_zh-CN.md
- [x] T012 [US2] Write Chinese section: 使用示例 (Examples — 6 subsections, translated from README.md lines 244-291) in README_zh-CN.md

**Checkpoint**: All configuration-related chapters are now in Chinese — users can self-serve all config scenarios

---

## Phase 4: User Story 3 - 中文 API 参考 (Priority: P3)

**Goal**: 开发者仅凭中文 API 参考完成自动化脚本，调用 /sub 端点进行格式转换

**Independent Test**: 开发者仅凭中文 API 章节，编写脚本调用 /sub 端点完成一次带参数的订阅转换

### Implementation for User Story 3

- [x] T013 [US3] Write Chinese section: API 端点 — /sub endpoint with full parameter table (translated from README.md lines 58-89) in README_zh-CN.md
- [x] T014 [US3] Write Chinese section: 支持的输出格式 table + /version + /flushcache + /health endpoints (translated from README.md lines 90-131) in README_zh-CN.md

**Checkpoint**: All API documentation is in Chinese — developers can integrate without reading English docs

---

## Phase 5: Polish & Cross-Linking

**Purpose**: Ensure both language versions link to each other, terminology consistency, and final review

- [x] T015 Add Chinese doc entry link in English README.md (top of file, e.g., "中文文档 | [简体中文](./README_zh-CN.md)")
- [x] T016 Add English doc entry link in README_zh-CN.md (top of file, e.g., "English | [English](./README.md)")
- [x] T017 Review terminology consistency across README_zh-CN.md against research.md glossary
- [x] T018 Verify all code blocks and bash commands in README_zh-CN.md match README.md exactly and are copy-paste executable
- [x] T019 Run quickstart.md validation checklist against README_zh-CN.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Phase 1 (T001) — must understand source before translating core
- **User Story 2 (Phase 3)**: Depends on Phase 1 (T001) — independently testable, can start in parallel with US1
- **User Story 3 (Phase 4)**: Depends on Phase 1 (T001) — independently testable, can start in parallel with US1/US2
- **Polish (Phase 5)**: Depends on all user stories being complete (Phases 2-4)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after T001 — No dependencies on other stories
- **User Story 2 (P2)**: Can start after T001 — Independently testable (just reads config sections)
- **User Story 3 (P3)**: Can start after T001 — Independently testable (just reads API sections)

### Within Each User Story

- Tasks are sequential within a story only because they all write to the same file (`README_zh-CN.md`)
- Sections within a story have no content dependencies on each other
- Stories can proceed in parallel if separate writers are assigned

### Parallel Opportunities

- **Phase 2 (US1)**: T003 and T007 are independent sections — could be written in parallel by different contributors editing different sections of the same file
- **Phases 2, 3, 4 (US1, US2, US3)**: All three user stories can be drafted in parallel since they cover disjoint sections of README.md
- **Phase 5 (Polish)**: T017 and T018 can run in parallel (different check aspects)

---

## Parallel Example: User Story 1

```bash
# After T001 (analysis), launch independent section writes in parallel:
Task: "T002 Write Chinese header/intro in README_zh-CN.md"
Task: "T003 Write Chinese Features section in README_zh-CN.md"
Task: "T004 Write Chinese Installation section in README_zh-CN.md"
Task: "T005 Write Chinese Quick Start section in README_zh-CN.md"

# Then continue with remaining sections:
Task: "T006 Write Chinese Development section in README_zh-CN.md"
Task: "T007 Write Chinese Protocols + License in README_zh-CN.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: Analyze English README
2. Complete Phase 2 (T002-T007): Core README sections
3. **STOP and VALIDATE**: Have a new Chinese-speaking user try to install and run the project using only README_zh-CN.md
4. If the user succeeds within 5 minutes, MVP is ready

### Incremental Delivery

1. T001 → Source material understood
2. Phase 2 → Core README in Chinese (MVP!)
3. Phase 3 → Configuration reference added
4. Phase 4 → API reference added
5. Phase 5 → Cross-links and polish → Feature complete

### Single Contributor Strategy

For one person working sequentially:
1. T001 → T002 → T003 → T004 → T005 → T006 → T007 (US1 complete)
2. T008 → T009 → T010 → T011 → T012 (US2 complete)
3. T013 → T014 (US3 complete)
4. T015 → T016 → T017 → T018 → T019 (Polish)

---

## Notes

- All tasks write to a single file: `README_zh-CN.md` — ensure each task appends to or edits the correct section
- Code blocks, commands, URLs, file paths MUST be copied verbatim from README.md (not translated)
- Refer to research.md for the approved terminology glossary
- Refer to data-model.md for the chapter mapping table
- Refer to quickstart.md for the final review checklist
- After all tasks complete, `README_zh-CN.md` should be a complete, standalone Chinese translation of `README.md`
