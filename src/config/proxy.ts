export enum ProxyType {
  Unknown = 0,
  Shadowsocks = 1,
  ShadowsocksR = 2,
  VMess = 3,
  Trojan = 4,
  Snell = 5,
  HTTP = 6,
  HTTPS = 7,
  SOCKS5 = 8,
  WireGuard = 9,
  Hysteria = 10,
  Hysteria2 = 11,
}

export enum TriBool {
  Unset = -1,
  False = 0,
  True = 1,
}

export class Proxy {
  type: ProxyType = ProxyType.Unknown;
  group = '';
  remark = '';
  hostname = '';
  port = 0;

  // Shadowsocks / ShadowsocksR
  username = '';
  password = '';
  encryptMethod = '';
  plugin = '';
  pluginOption = '';
  protocol = '';
  protocolParam = '';
  obfs = '';
  obfsParam = '';

  // VMess
  userId = '';
  alterId = 0;
  transferProtocol = 'tcp';
  fakeType = 'none';
  tlsSecure: TriBool = TriBool.False;
  host = '';
  path = '';
  edge = '';
  serverName = '';

  // QUIC
  quicSecure = '';
  quicSecret = '';

  // Trojan / TLS
  snellVersion = 0;
  allowInsecure: TriBool = TriBool.False;
  tls13: TriBool = TriBool.Unset;

  // Common flags
  udp: TriBool = TriBool.Unset;
  tcpFastOpen: TriBool = TriBool.Unset;

  // WireGuard
  selfIP = '';
  publicKey = '';
  privateKey = '';
  preSharedKey = '';
  dnsServers: string[] = [];
  mtu = 0;
  allowedIPs: string[] = [];
  keepAlive = 0;

  // Hysteria
  ports = '';
  upSpeed = 0;
  downSpeed = 0;
  authStr = '';
  sni = '';
  fingerprint = '';
  ca = '';
  alpn: string[] = [];
  recvWindow = 0;

  // Hysteria2
  obfsPassword = '';
  cwnd = 0;

  constructor(type: ProxyType = ProxyType.Unknown) {
    this.type = type;
  }

  clone(): Proxy {
    const p = new Proxy(this.type);
    Object.assign(p, this);
    p.dnsServers = [...this.dnsServers];
    p.allowedIPs = [...this.allowedIPs];
    p.alpn = [...this.alpn];
    return p;
  }
}
