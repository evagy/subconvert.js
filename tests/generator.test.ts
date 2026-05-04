import { describe, it, expect } from 'vitest';
import { Proxy, ProxyType, TriBool } from '../src/config/proxy';
import { ProxyGroupConfig, ProxyGroupType } from '../src/config/proxygroup';
import { RulesetConfig } from '../src/config/ruleset';
import { proxyToClash } from '../src/generator/clash';
import { proxyToSurge } from '../src/generator/surge';
import { proxyToQuanX } from '../src/generator/quanx';
import { proxyToLoon } from '../src/generator/loon';
import { proxyToSingBox } from '../src/generator/singbox';
import {
  proxyToSSLink,
  proxyToSSRLink,
  proxyToVmessLink,
  proxyToTrojanLink,
  proxyToHysteria2Link,
  proxyListToMixed,
  proxyListToBase64,
} from '../src/generator/single';
import { exportConfig, autoDetectTarget } from '../src/generator/subexport';

function createTestSSProxy(): Proxy {
  const proxy = new Proxy(ProxyType.Shadowsocks);
  proxy.hostname = 'server.example.com';
  proxy.port = 1080;
  proxy.encryptMethod = 'aes-256-gcm';
  proxy.password = 'password';
  proxy.remark = 'TestSS';
  return proxy;
}

function createTestVMessProxy(): Proxy {
  const proxy = new Proxy(ProxyType.VMess);
  proxy.hostname = 'server.example.com';
  proxy.port = 443;
  proxy.userId = '12345678-1234-1234-1234-1234567890ab';
  proxy.alterId = 0;
  proxy.encryptMethod = 'auto';
  proxy.tlsSecure = TriBool.True;
  proxy.transferProtocol = 'ws';
  proxy.host = 'example.com';
  proxy.path = '/vmess';
  proxy.remark = 'TestVMess';
  return proxy;
}

function createTestTrojanProxy(): Proxy {
  const proxy = new Proxy(ProxyType.Trojan);
  proxy.hostname = 'server.example.com';
  proxy.port = 443;
  proxy.password = 'password';
  proxy.serverName = 'example.com';
  proxy.remark = 'TestTrojan';
  return proxy;
}

function createTestHysteria2Proxy(): Proxy {
  const proxy = new Proxy(ProxyType.Hysteria2);
  proxy.hostname = 'server.example.com';
  proxy.port = 443;
  proxy.password = 'password';
  proxy.sni = 'example.com';
  proxy.remark = 'TestHY2';
  return proxy;
}

describe('Single Link Generators', () => {
  it('should generate SS link', () => {
    const proxy = createTestSSProxy();
    const link = proxyToSSLink(proxy);

    expect(link).toMatch(/^ss:\/\//);
    expect(link).toContain('@server.example.com:1080');
    expect(link).toContain('#TestSS');
  });

  it('should generate VMess link', () => {
    const proxy = createTestVMessProxy();
    const link = proxyToVmessLink(proxy);

    expect(link).toMatch(/^vmess:\/\//);

    // Decode and verify
    const encoded = link.slice(8);
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
    expect(decoded.ps).toBe('TestVMess');
    expect(decoded.add).toBe('server.example.com');
    expect(decoded.port).toBe(443);
    expect(decoded.id).toBe('12345678-1234-1234-1234-1234567890ab');
    expect(decoded.net).toBe('ws');
    expect(decoded.tls).toBe('tls');
  });

  it('should generate Trojan link', () => {
    const proxy = createTestTrojanProxy();
    const link = proxyToTrojanLink(proxy);

    expect(link).toMatch(/^trojan:\/\//);
    expect(link).toContain('password@server.example.com:443');
    expect(link).toContain('#TestTrojan');
  });

  it('should generate Hysteria2 link', () => {
    const proxy = createTestHysteria2Proxy();
    const link = proxyToHysteria2Link(proxy);

    expect(link).toMatch(/^hy2:\/\//);
    expect(link).toContain('password@server.example.com:443');
    expect(link).toContain('#TestHY2');
  });

  it('should generate mixed subscription', () => {
    const proxies = [createTestSSProxy(), createTestTrojanProxy()];
    const mixed = proxyListToMixed(proxies);

    expect(mixed).toContain('ss://');
    expect(mixed).toContain('trojan://');
  });

  it('should generate base64 subscription', () => {
    const proxies = [createTestSSProxy()];
    const b64 = proxyListToBase64(proxies);

    const decoded = Buffer.from(b64, 'base64').toString();
    expect(decoded).toContain('ss://');
  });
});

describe('Clash Generator', () => {
  it('should generate clash config', () => {
    const proxies = [createTestSSProxy(), createTestVMessProxy()];
    const groups: ProxyGroupConfig[] = [];
    const rulesets: RulesetConfig[] = [];

    const output = proxyToClash(proxies, groups, rulesets, new Map());

    expect(output).toContain('proxies:');
    expect(output).toContain('name: TestSS');
    expect(output).toContain('type: ss');
    expect(output).toContain('name: TestVMess');
    expect(output).toContain('type: vmess');
  });

  it('should generate clash config with proxy groups', () => {
    const proxies = [createTestSSProxy()];
    const groups = [new ProxyGroupConfig('Proxy', ProxyGroupType.Select)];
    groups[0].proxies = ['.*'];
    const rulesets: RulesetConfig[] = [];

    const output = proxyToClash(proxies, groups, rulesets, new Map());

    expect(output).toContain('proxy-groups:');
    expect(output).toContain('name: Proxy');
    expect(output).toContain('type: select');
  });
});

describe('Surge Generator', () => {
  it('should generate surge config', () => {
    const proxies = [createTestSSProxy(), createTestTrojanProxy()];
    const groups: ProxyGroupConfig[] = [];
    const rulesets: RulesetConfig[] = [];

    const output = proxyToSurge(proxies, groups, rulesets, new Map());

    expect(output).toContain('[General]');
    expect(output).toContain('[Proxy]');
    expect(output).toContain('TestSS = ss, server.example.com, 1080');
    expect(output).toContain('TestTrojan = trojan, server.example.com, 443');
    expect(output).toContain('DIRECT = direct');
  });
});

describe('Quantumult X Generator', () => {
  it('should generate quanx config', () => {
    const proxies = [createTestSSProxy()];
    const groups: ProxyGroupConfig[] = [];
    const rulesets: RulesetConfig[] = [];

    const output = proxyToQuanX(proxies, groups, rulesets, new Map());

    expect(output).toContain('shadowsocks = server.example.com:1080');
    expect(output).toContain('method=aes-256-gcm');
    expect(output).toContain('password=password');
    expect(output).toContain('tag=TestSS');
  });
});

describe('Loon Generator', () => {
  it('should generate loon config', () => {
    const proxies = [createTestSSProxy(), createTestTrojanProxy()];
    const groups: ProxyGroupConfig[] = [];
    const rulesets: RulesetConfig[] = [];

    const output = proxyToLoon(proxies, groups, rulesets, new Map());

    expect(output).toContain('[General]');
    expect(output).toContain('[Proxy]');
    expect(output).toContain('TestSS = shadowsocks, server.example.com, 1080');
    expect(output).toContain('TestTrojan = trojan, server.example.com, 443');
  });
});

describe('sing-box Generator', () => {
  it('should generate singbox config', () => {
    const proxies = [createTestSSProxy(), createTestTrojanProxy()];
    const groups: ProxyGroupConfig[] = [];
    const rulesets: RulesetConfig[] = [];

    const output = proxyToSingBox(proxies, groups, rulesets, new Map());
    const config = JSON.parse(output);

    expect(config.outbounds).toBeDefined();
    expect(config.outbounds.length).toBeGreaterThanOrEqual(2);

    const ssOutbound = config.outbounds.find((o: any) => o.tag === 'TestSS');
    expect(ssOutbound).toBeDefined();
    expect(ssOutbound.type).toBe('shadowsocks');
    expect(ssOutbound.server).toBe('server.example.com');
    expect(ssOutbound.server_port).toBe(1080);

    const trojanOutbound = config.outbounds.find((o: any) => o.tag === 'TestTrojan');
    expect(trojanOutbound).toBeDefined();
    expect(trojanOutbound.type).toBe('trojan');
  });
});

describe('Export Config', () => {
  it('should export to clash format', () => {
    const proxies = [createTestSSProxy()];
    const output = exportConfig({
      target: 'clash',
      proxies,
      proxyGroups: [],
      rulesets: [],
      rulesetContent: new Map(),
    });

    expect(output).toContain('proxies:');
    expect(output).toContain('TestSS');
  });

  it('should export to surge format', () => {
    const proxies = [createTestSSProxy()];
    const output = exportConfig({
      target: 'surge',
      proxies,
      proxyGroups: [],
      rulesets: [],
      rulesetContent: new Map(),
    });

    expect(output).toContain('[Proxy]');
    expect(output).toContain('TestSS');
  });

  it('should export mixed subscription', () => {
    const proxies = [createTestSSProxy()];
    const output = exportConfig({
      target: 'mixed',
      proxies,
      proxyGroups: [],
      rulesets: [],
      rulesetContent: new Map(),
    });

    // Should be base64 encoded
    const decoded = Buffer.from(output, 'base64').toString();
    expect(decoded).toContain('ss://');
  });

  it('should auto-detect target from user agent', () => {
    expect(autoDetectTarget('Clash for Android')).toBe('clash');
    expect(autoDetectTarget('Surge/4')).toBe('surge');
    expect(autoDetectTarget('Quantumult X')).toBe('quanx');
    expect(autoDetectTarget('Loon')).toBe('loon');
    expect(autoDetectTarget('Shadowrocket')).toBe('mixed');
    expect(autoDetectTarget('Sing-Box')).toBe('singbox');
    expect(autoDetectTarget('Unknown')).toBe('clash'); // default
  });
});
