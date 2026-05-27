# subconvert.js

[**English**](./README.md) | [**简体中文**](./README_zh-CN.md)

A proxy subscription format converter implemented in TypeScript, compatible with the original [subconverter](https://github.com/tindy2013/subconverter) project.

## Features

- **Multiple Input Formats**: SS, SSR, VMess, Trojan, Hysteria2, Clash YAML, Surge, Quantumult, SSD, base64 subscriptions
- **Multiple Output Formats**: Clash, ClashR, Surge, Surfboard, Quantumult X, Loon, sing-box, individual links (SS/SSR/VMess/Trojan)
- **Proxy Management**: Filtering, renaming, emoji support, type annotation
- **Ruleset Support**: Inject routing rules from remote rulesets
- **HTTP API**: RESTful API for subscription conversion
- **External Configuration**: Support for external config files via URL

## Installation

```bash
# Clone the repository
git clone git@github.com:evagy/subconvert.js.git
cd subconvert.js

# Install dependencies
npm install

# Start the server
npm run dev
```

## Quick Start

### Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start at `http://127.0.0.1:25500` by default.

### macOS Background Service (launchd)

On macOS, you can install subconverter as a launchd socket-activated service. launchd listens on port 25500 and automatically starts the server when the first request arrives — no need to manually start/stop the server.

```bash
# Build and install the launchd service
npm run service:install
```

After installation, launchd listens on `127.0.0.1:25500`. The server starts on the first request and automatically shuts down after 1 minute without requests. This is ideal for use with Clash Verge or other proxy clients that periodically refresh their subscriptions.

```bash
# Verify the service is working
curl http://127.0.0.1:25500/version

# Uninstall the service
npm run service:uninstall
```

How it works: launchd binds to the port and passes the listening socket to the Node.js process when a connection arrives. The server detects the socket activation and accepts connections on the inherited file descriptor. After 1 minute of idle, the process exits and launchd returns to listening, ready to start again on the next request.

### Basic Usage

Convert a subscription to Clash format:

```bash
# Single SS link
curl "http://127.0.0.1:25500/sub?target=clash&url=ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@server.example.com:1080#MyServer"

# Multiple links (URL-encoded, separated by |)
curl "http://127.0.0.1:25500/sub?target=clash&url=ss://...|trojan://..."

# Base64 subscription
curl "http://127.0.0.1:25500/sub?target=clash&url=https://example.com/subscription"
```

## API Endpoints

### `GET /sub`

Main conversion endpoint.

**Parameters:**

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `target` | Yes | Output format | `clash`, `surge`, `quanx`, `loon`, `singbox`, `auto` |
| `url` | Yes | Subscription URL(s), pipe-separated | `ss://...\|trojan://...` |
| `group` | No | Custom group name for all nodes | `MyProxies` |
| `include` | No | Include remarks filter (regex, backtick-separated) | `HK\|SG` |
| `exclude` | No | Exclude remarks filter (regex, backtick-separated) | `Expire\|Traffic` |
| `rename` | No | Rename rules (backtick-separated, `@` as separator) | `(.*) - 搬瓦工@$1 - BWG` |
| `add_emoji` | No | Add emoji to node names | `true` |
| `remove_emoji` | No | Remove existing emoji | `true` |
| `append_type` | No | Append proxy type to node name | `true` |
| `sort` | No | Sort nodes alphabetically | `true` |
| `udp` | No | Enable UDP relay | `true` |
| `tfo` | No | Enable TCP Fast Open | `true` |
| `scv` | No | Skip certificate verification | `true` |
| `tls13` | No | Enable TLS 1.3 | `true` |
| `classic` | No | Use classical rule format | `true` |
| `list` | No | Generate node list only (no rules) | `true` |
| `config` | No | External config file URL | `https://example.com/config.ini` |
| `ver` | No | Surge version (2, 3, 4) | `4` |
| `new_name` | No | Use new Clash field names | `true` |
| `dev_id` | No | Quantumult X device ID | `DEVICE_ID` |
| `filename` | No | Content-Disposition filename | `my_config` |

**Supported Target Formats:**

| Target | Description |
|--------|-------------|
| `clash` | Clash YAML config |
| `clashr` | ClashR YAML config |
| `surge` | Surge config |
| `surfboard` | Surfboard config |
| `quanx` | Quantumult X config |
| `loon` | Loon config |
| `singbox` | sing-box JSON config |
| `ss` | SS links (base64) |
| `ssr` | SSR links (base64) |
| `v2ray` | VMess links (base64) |
| `trojan` | Trojan links |
| `mixed` | Mixed subscription (base64) |
| `auto` | Auto-detect from User-Agent |

### `GET /version`

Returns server version.

```bash
curl "http://127.0.0.1:25500/version"
# {"version":"1.0.0","name":"subconverter-ts"}
```

### `GET /flushcache`

Clears the URL fetch cache.

```bash
curl "http://127.0.0.1:25500/flushcache"
```

### `GET /health`

Health check endpoint.

```bash
curl "http://127.0.0.1:25500/health"
# {"status":"ok"}
```

## Configuration

Edit `pref.ini` to configure the server:

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

### Emoji Configuration

Add emoji to node names based on region:

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

### Proxy Group Configuration

Define proxy groups with filtering rules:

```ini
[proxy_groups]
# Select group (manual selection)
Proxy = select@.*

# URL test group (auto select fastest)
Auto = url-test@.*@http://www.gstatic.com/generate_204@300

# Fallback group (failover)
Fallback = fallback@.*@http://www.gstatic.com/generate_204@300

# Region-specific groups
🇭🇰 香港 = select@.*香港.*|.*HK.*|.*Hong Kong.*
🇯🇵 日本 = select@.*日本.*|.*JP.*|.*Japan.*
🇺🇸 美国 = select@.*美国.*|.*US.*|.*United States.*
```

### Ruleset Configuration

Add routing rules:

```ini
[rulesets]
# Remote ruleset
DOMAIN-SUFFIX,google.com,Proxy = https://example.com/google.txt@3600
DOMAIN-SUFFIX,github.com,Proxy = https://example.com/github.txt@3600

# Direct rules
DOMAIN-SUFFIX,baidu.com,DIRECT
DOMAIN-SUFFIX,qq.com,DIRECT
```

## External Configuration

Use the `config` parameter to load external configuration:

```bash
curl "http://127.0.0.1:25500/sub?target=clash&url=...&config=https://example.com/config.ini"
```

External config format is the same as `pref.ini`.

## Examples

### Convert to Clash

```bash
curl "http://127.0.0.1:25500/sub?target=clash&url=https://example.com/sub"
```

### Convert to Surge

```bash
curl "http://127.0.0.1:25500/sub?target=surge&ver=4&url=https://example.com/sub"
```

### Convert to Quantumult X

```bash
curl "http://127.0.0.1:25500/sub?target=quanx&dev_id=YOUR_DEVICE_ID&url=https://example.com/sub"
```

### Convert to sing-box

```bash
curl "http://127.0.0.1:25500/sub?target=singbox&url=https://example.com/sub"
```

### Filter by Region

```bash
# Only Hong Kong and Singapore servers
curl "http://127.0.0.1:25500/sub?target=clash&url=...&include=HK|SG"

# Exclude expired nodes
curl "http://127.0.0.1:25500/sub?target=clash&url=...&exclude=Expire|Traffic"
```

### Add Emoji and Sort

```bash
curl "http://127.0.0.1:25500/sub?target=clash&url=...&add_emoji=true&sort=true"
```

### Rename Nodes

```bash
# Rename "Server - 搬瓦工" to "Server - BWG"
curl "http://127.0.0.1:25500/sub?target=clash&url=...&rename=(.*) - 搬瓦工@$1 - BWG"
```

## Development

### Project Structure

```
src/
├── index.ts              # Entry point
├── config/               # Data structures
│   ├── proxy.ts          # Proxy node class
│   ├── proxygroup.ts     # Proxy group config
│   ├── ruleset.ts        # Ruleset config
│   ├── regmatch.ts       # Regex match config
│   └── settings.ts       # Settings types
├── parser/               # Input format parsers
│   ├── ss.ts             # Shadowsocks
│   ├── ssr.ts            # ShadowsocksR
│   ├── vmess.ts          # VMess
│   ├── trojan.ts         # Trojan
│   ├── hysteria2.ts      # Hysteria2
│   ├── clash.ts          # Clash YAML
│   ├── surge.ts          # Surge config
│   ├── quan.ts           # Quantumult
│   └── subscription.ts   # Base64 subscription
├── generator/            # Output format generators
│   ├── clash.ts          # Clash YAML
│   ├── surge.ts          # Surge config
│   ├── quanx.ts          # Quantumult X
│   ├── loon.ts           # Loon
│   ├── singbox.ts        # sing-box JSON
│   └── single.ts         # Individual links
├── handler/              # HTTP handlers
│   ├── interfaces.ts     # API handlers
│   └── webserver.ts      # Express server
└── utils/                # Utilities
    ├── base64.ts         # Base64 encode/decode
    ├── url.ts            # URL fetch with cache
    ├── ini.ts            # INI parsing
    └── template.ts       # Template engine
```

### Run Tests

```bash
npm test
```

### Build

```bash
npm run build
```

## Supported Protocols

| Protocol | Input | Output |
|----------|-------|--------|
| Shadowsocks (SS) | ✅ | ✅ |
| ShadowsocksR (SSR) | ✅ | ✅ |
| VMess | ✅ | ✅ |
| Trojan | ✅ | ✅ |
| Hysteria2 | ✅ | ✅ |
| HTTP/HTTPS | ✅ | ✅ |
| SOCKS5 | ✅ | ✅ |
| WireGuard | ✅ | ✅ |

## License

MIT
