# subconvert.js

[English](./README.md) | **简体中文**

一个用 TypeScript 实现的代理订阅格式转换器，兼容原版 [subconverter](https://github.com/tindy2013/subconverter) 项目。

## 功能特性

- **多种输入格式**: SS、SSR、VMess、Trojan、Hysteria2、Clash YAML、Surge、Quantumult、SSD、base64 订阅
- **多种输出格式**: Clash、ClashR、Surge、Surfboard、Quantumult X、Loon、sing-box、独立链接（SS/SSR/VMess/Trojan）
- **代理管理**: 过滤、重命名、Emoji 支持、类型标注
- **规则集支持**: 从远程规则集注入分流规则
- **HTTP API**: RESTful API 用于订阅转换
- **外部配置**: 支持通过 URL 加载外部配置文件

## 安装

```bash
# 克隆仓库
git clone git@github.com:evagy/subconvert.js.git
cd subconvert.js

# 安装依赖
npm install

# 启动服务器
npm run dev
```

## 快速开始

### 启动服务器

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务器默认在 `http://127.0.0.1:25500` 启动。

### macOS 后台服务（launchd）

在 macOS 上，可以将 subconverter 安装为 launchd socket 激活服务。launchd 监听 25500 端口，在首次请求到达时自动启动服务器——无需手动启停。

```bash
# 构建并安装 launchd 服务
npm run service:install
```

安装后，launchd 即监听 `127.0.0.1:25500`。服务器在首次请求时启动，空闲 1 分钟后自动停止。非常适合与 Clash Verge 等需要定期刷新订阅的代理客户端配合使用。

```bash
# 验证服务是否正常
curl http://127.0.0.1:25500/version

# 卸载服务
npm run service:uninstall
```

工作原理：launchd 绑定端口并将监听 socket 传给 Node.js 进程。服务器检测到 socket 激活模式后，直接使用继承的文件描述符接受连接。空闲 1 分钟后进程自动退出，launchd 重新回到监听状态，等待下次请求再次启动。

### 基本用法

将订阅转换为 Clash 格式：

```bash
# 单个 SS 链接
curl "http://127.0.0.1:25500/sub?target=clash&url=ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@server.example.com:1080#MyServer"

# 多个链接（URL 编码，用 | 分隔）
curl "http://127.0.0.1:25500/sub?target=clash&url=ss://...|trojan://..."

# Base64 订阅
curl "http://127.0.0.1:25500/sub?target=clash&url=https://example.com/subscription"
```

## API 端点

### `GET /sub`

主要的转换端点。

**参数：**

| 参数 | 必填 | 描述 | 示例 |
|-----------|----------|-------------|---------|
| `target` | 是 | 输出格式 | `clash`、`surge`、`quanx`、`loon`、`singbox`、`auto` |
| `url` | 是 | 订阅 URL，多个用竖线分隔 | `ss://...\|trojan://...` |
| `group` | 否 | 所有节点的自定义组名 | `MyProxies` |
| `include` | 否 | 按节点名称过滤（正则，用反引号分隔） | `HK\|SG` |
| `exclude` | 否 | 按节点名称排除（正则，用反引号分隔） | `Expire\|Traffic` |
| `rename` | 否 | 重命名规则（反引号分隔，`@` 作为分隔符） | `(.*) - 搬瓦工@$1 - BWG` |
| `add_emoji` | 否 | 为节点名称添加 Emoji | `true` |
| `remove_emoji` | 否 | 移除已有的 Emoji | `true` |
| `append_type` | 否 | 在节点名称后追加代理类型 | `true` |
| `sort` | 否 | 按字母排序节点 | `true` |
| `udp` | 否 | 启用 UDP 中继 | `true` |
| `tfo` | 否 | 启用 TCP Fast Open | `true` |
| `scv` | 否 | 跳过证书验证 | `true` |
| `tls13` | 否 | 启用 TLS 1.3 | `true` |
| `classic` | 否 | 使用经典规则格式 | `true` |
| `list` | 否 | 仅生成节点列表（不含规则） | `true` |
| `config` | 否 | 外部配置文件 URL | `https://example.com/config.ini` |
| `ver` | 否 | Surge 版本（2、3、4） | `4` |
| `new_name` | 否 | 使用新的 Clash 字段名 | `true` |
| `dev_id` | 否 | Quantumult X 设备 ID | `DEVICE_ID` |
| `filename` | 否 | Content-Disposition 文件名 | `my_config` |

**支持的输出格式：**

| Target | 描述 |
|--------|-------------|
| `clash` | Clash YAML 配置 |
| `clashr` | ClashR YAML 配置 |
| `surge` | Surge 配置 |
| `surfboard` | Surfboard 配置 |
| `quanx` | Quantumult X 配置 |
| `loon` | Loon 配置 |
| `singbox` | sing-box JSON 配置 |
| `ss` | SS 链接 (base64) |
| `ssr` | SSR 链接 (base64) |
| `v2ray` | VMess 链接 (base64) |
| `trojan` | Trojan 链接 |
| `mixed` | 混合订阅 (base64) |
| `auto` | 根据 User-Agent 自动检测 |

### `GET /version`

返回服务器版本。

```bash
curl "http://127.0.0.1:25500/version"
# {"version":"1.0.0","name":"subconverter-ts"}
```

### `GET /flushcache`

清除 URL 获取缓存。

```bash
curl "http://127.0.0.1:25500/flushcache"
```

### `GET /health`

健康检查端点。

```bash
curl "http://127.0.0.1:25500/health"
# {"status":"ok"}
```

## 配置

编辑 `pref.ini` 来配置服务器：

```ini
[common]
api_mode = false
access_token =
default_url =
insert_url =
exclude_remark =
include_remark =
external_config =
base_path = ./base

[node_pref]
udp = false
tcp_fast_open = false
skip_cert_verify = false
sort = false
append_type = false
new_field_name = false
add_emoji = false
remove_old_emoji = false

[server]
listen = 0.0.0.0
port = 25500

[emojis]
# 🇭🇰 = 香港|HK|Hong Kong
# 🇯🇵 = 日本|JP|Japan
# 🇺🇸 = 美国|US|United States
# 🇸🇬 = 新加坡|SG|Singapore
# 🇹🇼 = 台湾|TW|Taiwan

[rename_remarks]
# (.*) - 搬瓦工 = $1 - Bandwagon

[proxy_groups]
# Proxy = select@.*
# Auto = url-test@.*@http://www.gstatic.com/generate_204@300

[rulesets]
# DOMAIN-SUFFIX,google.com,Proxy = https://example.com/rules.txt@3600
```

### Emoji 配置

根据地区为节点名称添加 Emoji：

```ini
[emojis]
🇭🇰 = 香港|HK|Hong Kong
🇯🇵 = 日本|JP|Japan
🇺🇸 = 美国|US|United States|洛杉矶|圣何塞|硅谷
🇸🇬 = 新加坡|SG|Singapore
🇹🇼 = 台湾|TW|Taiwan
🇰🇷 = 韩国|KR|Korea
🇬🇧 = 英国|UK|United Kingdom|伦敦
🇩🇪 = 德国|DE|Germany
🇫🇷 = 法国|FR|France
```

每条 Emoji 规则的格式为：`Emoji = 匹配正则`。当节点名称匹配正则表达式时，对应的 Emoji 会被添加到节点名称前。

### 代理组配置

使用过滤规则定义代理组：

```ini
[proxy_groups]
# Select 组（手动选择）
Proxy = select@.*

# URL 测试组（自动选择最快的节点）
Auto = url-test@.*@http://www.gstatic.com/generate_204@300

# 故障转移组（节点故障时自动切换）
Fallback = fallback@.*@http://www.gstatic.com/generate_204@300

# 区域特定分组
🇭🇰 香港 = select@.*香港.*|.*HK.*|.*Hong Kong.*
🇯🇵 日本 = select@.*日本.*|.*JP.*|.*Japan.*
🇺🇸 美国 = select@.*美国.*|.*US.*|.*United States.*
```

代理组格式为：`组名 = 类型@过滤正则@测试URL@超时时间`

支持的组类型：
- `select`：手动选择节点
- `url-test`：自动选择延迟最低的节点，需指定测试 URL 和超时时间（毫秒）
- `fallback`：故障转移模式，当前节点不可用时自动切换到下一个

### 规则集配置

添加分流规则：

```ini
[rulesets]
# 远程规则集
DOMAIN-SUFFIX,google.com,Proxy = https://example.com/google.txt@3600
DOMAIN-SUFFIX,github.com,Proxy = https://example.com/github.txt@3600

# 直连规则
DOMAIN-SUFFIX,baidu.com,DIRECT
DOMAIN-SUFFIX,qq.com,DIRECT
```

远程规则集的格式为：`规则类型,匹配值,策略组 = URL@更新间隔（秒）`

本地规则格式为：`规则类型,匹配值,策略组`

## 外部配置

使用 `config` 参数加载外部配置文件：

```bash
curl "http://127.0.0.1:25500/sub?target=clash&url=...&config=https://example.com/config.ini"
```

外部配置格式与 `pref.ini` 相同。

## 使用示例

### 转换为 Clash

```bash
curl "http://127.0.0.1:25500/sub?target=clash&url=https://example.com/sub"
```

### 转换为 Surge

```bash
curl "http://127.0.0.1:25500/sub?target=surge&ver=4&url=https://example.com/sub"
```

### 转换为 Quantumult X

```bash
curl "http://127.0.0.1:25500/sub?target=quanx&dev_id=YOUR_DEVICE_ID&url=https://example.com/sub"
```

### 转换为 sing-box

```bash
curl "http://127.0.0.1:25500/sub?target=singbox&url=https://example.com/sub"
```

### 按区域过滤

```bash
# 仅保留香港和新加坡节点
curl "http://127.0.0.1:25500/sub?target=clash&url=...&include=HK|SG"

# 排除过期节点
curl "http://127.0.0.1:25500/sub?target=clash&url=...&exclude=Expire|Traffic"
```

### 添加 Emoji 并排序

```bash
curl "http://127.0.0.1:25500/sub?target=clash&url=...&add_emoji=true&sort=true"
```

### 重命名节点

```bash
# 将 "Server - 搬瓦工" 重命名为 "Server - BWG"
curl "http://127.0.0.1:25500/sub?target=clash&url=...&rename=(.*) - 搬瓦工@$1 - BWG"
```

## 开发

### 项目结构

```
src/
├── index.ts              # 入口文件
├── config/               # 数据结构
│   ├── proxy.ts          # 代理节点类
│   ├── proxygroup.ts     # 代理组配置
│   ├── ruleset.ts        # 规则集配置
│   ├── regmatch.ts       # 正则匹配配置
│   └── settings.ts       # 设置类型
├── parser/               # 输入格式解析器
│   ├── ss.ts             # Shadowsocks
│   ├── ssr.ts            # ShadowsocksR
│   ├── vmess.ts          # VMess
│   ├── trojan.ts         # Trojan
│   ├── hysteria2.ts      # Hysteria2
│   ├── clash.ts          # Clash YAML
│   ├── surge.ts          # Surge 配置
│   ├── quan.ts           # Quantumult
│   └── subscription.ts   # Base64 订阅
├── generator/            # 输出格式生成器
│   ├── clash.ts          # Clash YAML
│   ├── surge.ts          # Surge 配置
│   ├── quanx.ts          # Quantumult X
│   ├── loon.ts           # Loon
│   ├── singbox.ts        # sing-box JSON
│   └── single.ts         # 独立链接
├── handler/              # HTTP 处理器
│   ├── interfaces.ts     # API 处理器
│   └── webserver.ts      # Express 服务器
└── utils/                # 工具函数
    ├── base64.ts         # Base64 编解码
    ├── url.ts            # URL 获取（带缓存）
    ├── ini.ts            # INI 解析
    └── template.ts       # 模板引擎
```

### 运行测试

```bash
npm test
```

### 构建

```bash
npm run build
```

## 支持的协议

| 协议 | 输入 | 输出 |
|----------|-------|--------|
| Shadowsocks (SS) | ✅ | ✅ |
| ShadowsocksR (SSR) | ✅ | ✅ |
| VMess | ✅ | ✅ |
| Trojan | ✅ | ✅ |
| Hysteria2 | ✅ | ✅ |
| HTTP/HTTPS | ✅ | ✅ |
| SOCKS5 | ✅ | ✅ |
| WireGuard | ✅ | ✅ |

## 许可证

MIT
