# Quickstart: 中文文档维护指南

**Feature**: 增加中文文档
**Date**: 2026-05-09

## 新增中文文档

`README_zh-CN.md` 是 `README.md` 的完整中文翻译版本。创建后即可使用，无需额外配置。

## 维护规则

当英文 README.md 发生更新时，应同步更新中文文档：

1. 对比 `README.md` 的 diff 确定变更范围
2. 在 `README_zh-CN.md` 中对应章节进行翻译更新
3. 确保代码块和命令未发生改动
4. 检查术语一致性（参考 [research.md](./research.md) 中的术语对照表）

## 审阅清单

- [ ] 所有英文 README 章节在中文文档中均有对应
- [ ] 代码块、命令、URL 与英文版本一致
- [ ] 术语翻译符合对照表规范，全文一致
- [ ] 中文文档入口链接在英文 README 中可见
- [ ] Markdown 语法正确，可在 GitHub 上正常渲染
