import { describe, it, expect } from 'vitest';
import { parseSS } from '../src/parser/ss';
import { parseSSR } from '../src/parser/ssr';
import { parseVmess } from '../src/parser/vmess';
import { parseTrojan } from '../src/parser/trojan';
import { parseHysteria2 } from '../src/parser/hysteria2';
import { parseClash } from '../src/parser/clash';
import { parseSurge } from '../src/parser/surge';
import { parseSubscription } from '../src/parser/subscription';
import { ProxyType, TriBool } from '../src/config/proxy';

describe('Shadowsocks Parser', () => {
  it('should parse SIP002 format', () => {
    // ss://base64(method:password)@server:port#remark
    const link = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@127.0.0.1:1080#TestServer';
    const proxy = parseSS(link);

    expect(proxy).not.toBeNull();
    expect(proxy!.type).toBe(ProxyType.Shadowsocks);
    expect(proxy!.hostname).toBe('127.0.0.1');
    expect(proxy!.port).toBe(1080);
    expect(proxy!.encryptMethod).toBe('aes-256-gcm');
    expect(proxy!.password).toBe('password');
    expect(proxy!.remark).toBe('TestServer');
  });

  it('should parse legacy format', () => {
    // ss://base64(method:password@server:port)#remark
    const link = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmRAMTI3LjAuMC4xOjEwODA=#TestServer';
    const proxy = parseSS(link);

    expect(proxy).not.toBeNull();
    expect(proxy!.type).toBe(ProxyType.Shadowsocks);
    expect(proxy!.hostname).toBe('127.0.0.1');
    expect(proxy!.port).toBe(1080);
  });

  it('should parse with plugin', () => {
    const link = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@127.0.0.1:1080?plugin=obfs-local%3Bobfs%3Dhttp#TestPlugin';
    const proxy = parseSS(link);

    expect(proxy).not.toBeNull();
    expect(proxy!.plugin).toBe('obfs-local');
  });

  it('should return null for invalid link', () => {
    expect(parseSS('invalid')).toBeNull();
    expect(parseSS('vmess://...')).toBeNull();
  });
});

describe('ShadowsocksR Parser', () => {
  it('should parse SSR link', () => {
    // ssr://base64(server:port:protocol:method:obfs:base64(password)/?params)
    const content = '127.0.0.1:1080:auth_aes128_md5:aes-256-cfb:tls1.2_ticket_auth:cGFzc3dvcmQ/?remarks=VGVzdA==';
    const encoded = Buffer.from(content).toString('base64');
    const link = `ssr://${encoded}`;

    const proxy = parseSSR(link);

    expect(proxy).not.toBeNull();
    expect(proxy!.type).toBe(ProxyType.ShadowsocksR);
    expect(proxy!.hostname).toBe('127.0.0.1');
    expect(proxy!.port).toBe(1080);
    expect(proxy!.protocol).toBe('auth_aes128_md5');
    expect(proxy!.encryptMethod).toBe('aes-256-cfb');
    expect(proxy!.obfs).toBe('tls1.2_ticket_auth');
    expect(proxy!.password).toBe('password');
    expect(proxy!.remark).toBe('Test');
  });

  it('should return null for invalid link', () => {
    expect(parseSSR('invalid')).toBeNull();
    expect(parseSSR('ss://...')).toBeNull();
  });
});

describe('VMess Parser', () => {
  it('should parse v2rayN JSON format', () => {
    const vmessData = {
      v: '2',
      ps: 'Test VMess',
      add: '127.0.0.1',
      port: '443',
      id: '12345678-1234-1234-1234-1234567890ab',
      aid: '0',
      net: 'ws',
      type: 'none',
      host: 'example.com',
      path: '/vmess',
      tls: 'tls',
    };
    const encoded = Buffer.from(JSON.stringify(vmessData)).toString('base64');
    const link = `vmess://${encoded}`;

    const proxy = parseVmess(link);

    expect(proxy).not.toBeNull();
    expect(proxy!.type).toBe(ProxyType.VMess);
    expect(proxy!.hostname).toBe('127.0.0.1');
    expect(proxy!.port).toBe(443);
    expect(proxy!.userId).toBe('12345678-1234-1234-1234-1234567890ab');
    expect(proxy!.alterId).toBe(0);
    expect(proxy!.transferProtocol).toBe('ws');
    expect(proxy!.tlsSecure).toBe(TriBool.True);
    expect(proxy!.host).toBe('example.com');
    expect(proxy!.path).toBe('/vmess');
    expect(proxy!.remark).toBe('Test VMess');
  });

  it('should return null for invalid link', () => {
    expect(parseVmess('invalid')).toBeNull();
    expect(parseVmess('ss://...')).toBeNull();
  });
});

describe('Trojan Parser', () => {
  it('should parse trojan link', () => {
    const link = 'trojan://password@server.example.com:443?security=tls&sni=example.com#TestTrojan';
    const proxy = parseTrojan(link);

    expect(proxy).not.toBeNull();
    expect(proxy!.type).toBe(ProxyType.Trojan);
    expect(proxy!.hostname).toBe('server.example.com');
    expect(proxy!.port).toBe(443);
    expect(proxy!.password).toBe('password');
    expect(proxy!.serverName).toBe('example.com');
    expect(proxy!.remark).toBe('TestTrojan');
  });

  it('should return null for invalid link', () => {
    expect(parseTrojan('invalid')).toBeNull();
    expect(parseTrojan('ss://...')).toBeNull();
  });
});

describe('Hysteria2 Parser', () => {
  it('should parse hy2 link', () => {
    const link = 'hy2://password@server.example.com:443?sni=example.com&insecure=1#TestHY2';
    const proxy = parseHysteria2(link);

    expect(proxy).not.toBeNull();
    expect(proxy!.type).toBe(ProxyType.Hysteria2);
    expect(proxy!.hostname).toBe('server.example.com');
    expect(proxy!.port).toBe(443);
    expect(proxy!.password).toBe('password');
    expect(proxy!.sni).toBe('example.com');
    expect(proxy!.allowInsecure).toBe(TriBool.True);
    expect(proxy!.remark).toBe('TestHY2');
  });

  it('should parse hysteria2:// prefix', () => {
    const link = 'hysteria2://password@server.example.com:443#Test';
    const proxy = parseHysteria2(link);

    expect(proxy).not.toBeNull();
    expect(proxy!.type).toBe(ProxyType.Hysteria2);
  });
});

describe('Clash Parser', () => {
  it('should parse clash yaml with SS proxy', () => {
    const yaml = `
proxies:
  - name: TestSS
    type: ss
    server: server.example.com
    port: 1080
    cipher: aes-256-gcm
    password: password123
`;
    const proxies = parseClash(yaml);

    expect(proxies).toHaveLength(1);
    expect(proxies[0].type).toBe(ProxyType.Shadowsocks);
    expect(proxies[0].remark).toBe('TestSS');
    expect(proxies[0].hostname).toBe('server.example.com');
    expect(proxies[0].port).toBe(1080);
    expect(proxies[0].encryptMethod).toBe('aes-256-gcm');
    expect(proxies[0].password).toBe('password123');
  });

  it('should parse clash yaml with VMess proxy', () => {
    const yaml = `
proxies:
  - name: TestVMess
    type: vmess
    server: server.example.com
    port: 443
    uuid: 12345678-1234-1234-1234-1234567890ab
    alterId: 0
    cipher: auto
    tls: true
    network: ws
    ws-opts:
      path: /vmess
      headers:
        Host: example.com
`;
    const proxies = parseClash(yaml);

    expect(proxies).toHaveLength(1);
    expect(proxies[0].type).toBe(ProxyType.VMess);
    expect(proxies[0].remark).toBe('TestVMess');
    expect(proxies[0].userId).toBe('12345678-1234-1234-1234-1234567890ab');
    expect(proxies[0].tlsSecure).toBe(TriBool.True);
    expect(proxies[0].transferProtocol).toBe('ws');
  });

  it('should parse clash yaml with Trojan proxy', () => {
    const yaml = `
proxies:
  - name: TestTrojan
    type: trojan
    server: server.example.com
    port: 443
    password: password123
    sni: example.com
    skip-cert-verify: true
`;
    const proxies = parseClash(yaml);

    expect(proxies).toHaveLength(1);
    expect(proxies[0].type).toBe(ProxyType.Trojan);
    expect(proxies[0].password).toBe('password123');
    expect(proxies[0].serverName).toBe('example.com');
    expect(proxies[0].allowInsecure).toBe(TriBool.True);
  });

  it('should return empty array for invalid yaml', () => {
    expect(parseClash('invalid yaml')).toEqual([]);
    expect(parseClash('proxies: []')).toEqual([]);
  });
});

describe('Surge Parser', () => {
  it('should parse surge config', () => {
    const config = `[General]
loglevel = notify

[Proxy]
TestSS = ss, server.example.com, 1080, encrypt-method=aes-256-gcm, password=password123
TestTrojan = trojan, server2.example.com, 443, password=pass456, sni=example.com
DIRECT = direct

[Rule]
FINAL,DIRECT
`;
    const proxies = parseSurge(config);

    expect(proxies).toHaveLength(2);
    expect(proxies[0].remark).toBe('TestSS');
    expect(proxies[0].type).toBe(ProxyType.Shadowsocks);
    expect(proxies[0].hostname).toBe('server.example.com');
    expect(proxies[1].remark).toBe('TestTrojan');
    expect(proxies[1].type).toBe(ProxyType.Trojan);
  });
});

describe('Subscription Parser', () => {
  it('should parse base64 subscription', () => {
    const links = [
      'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@server1.example.com:1080#Server1',
      'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@server2.example.com:1080#Server2',
    ].join('\n');
    const encoded = Buffer.from(links).toString('base64');

    const proxies = parseSubscription(encoded);

    expect(proxies).toHaveLength(2);
    expect(proxies[0].remark).toBe('Server1');
    expect(proxies[1].remark).toBe('Server2');
  });

  it('should parse direct link list', () => {
    const content = `ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@server1.example.com:1080#Server1
trojan://password@server2.example.com:443#Server2`;

    const proxies = parseSubscription(content);

    expect(proxies).toHaveLength(2);
    expect(proxies[0].type).toBe(ProxyType.Shadowsocks);
    expect(proxies[1].type).toBe(ProxyType.Trojan);
  });
});
